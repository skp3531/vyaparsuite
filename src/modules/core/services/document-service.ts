/**
 * VyaparSuite Core Document Service
 * 
 * Central orchestrator for the entire ERP document lifecycle:
 * - Deterministic Finite State Machine (FSM) transitions
 * - Optimistic locking (versioning) & post-submission immutability
 * - Thread-safe naming series generation
 * - Integrated field-level audit trail (MCA Rule 3)
 * - Decoupled event emission via EventBus
 * - RBAC / ABAC / Segregation of Duties permission verification
 * - Parent-child transaction document handling
 */

import { 
  BaseDocument, 
  DocumentStatus, 
  DocumentAction, 
  VALID_TRANSITIONS, 
  ACTION_RESULTS,
  DocumentEvent,
  DocumentEventType,
  DoctypeDefinition,
  TransactionDocument,
  BaseDocumentItem
} from '../types/document';
import type { IDatabaseAdapter, QueryFilter, QuerySort } from '@/lib/db/adapter';
import { 
  ValidationError, 
  NotFoundError, 
  ConcurrencyError, 
  ImmutableRecordError, 
  BusinessRuleError, 
  PeriodClosedError 
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { NamingSeriesService, NamingContext } from './naming-series-service';
import { AuditService } from './audit-service';
import { EventBus, eventBus as defaultEventBus } from './event-bus';
import { PermissionService, UserSecurityContext, StandardAction } from './permission-service';

export interface DocumentContext {
  tenantId: string;
  companyId: string;
  userId: string;
  userEmail?: string;
  branchId?: string;
  companyCode?: string;
  branchCode?: string;
  roles: string[];
  allowedCompanyIds?: string[];
  allowedBranchIds?: string[];
  allowedWarehouseIds?: string[];
  approvalLimits?: Record<string, number>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
}

export type DocumentValidator<T extends BaseDocument> = (
  doc: T,
  context: DocumentContext
) => Promise<ValidationResult>;

export type DocumentHook<T extends BaseDocument> = (
  doc: T,
  context: DocumentContext
) => Promise<T>;

export interface DocumentServiceOptions {
  namingSeriesService?: NamingSeriesService;
  auditService?: AuditService;
  eventBus?: EventBus;
  permissionService?: PermissionService;
}

export interface DocumentListOptions {
  filters?: Array<{ column: string; operator: string; value: unknown }>;
  sort?: Array<{ column: string; direction: 'asc' | 'desc' }>;
  page?: number;
  pageSize?: number;
  select?: string;
}

export interface TransitionOptions {
  reason?: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}

export class DocumentService {
  private validators: Map<string, DocumentValidator<any>[]> = new Map();
  private beforeHooks: Map<string, Map<DocumentAction, DocumentHook<any>[]>> = new Map();
  private afterHooks: Map<string, Map<DocumentAction, DocumentHook<any>[]>> = new Map();
  private eventHandlers: Map<DocumentEventType, Array<(event: DocumentEvent) => Promise<void>>> = new Map();
  private doctypes: Map<string, DoctypeDefinition> = new Map();

  private namingSeriesService: NamingSeriesService;
  private auditService: AuditService;
  private eventBus: EventBus;
  private permissionService: PermissionService;

  constructor(
    private db: IDatabaseAdapter,
    options?: DocumentServiceOptions
  ) {
    this.namingSeriesService = options?.namingSeriesService || new NamingSeriesService(db);
    this.auditService = options?.auditService || new AuditService(db);
    this.eventBus = options?.eventBus || defaultEventBus;
    this.permissionService = options?.permissionService || new PermissionService(db);
  }

  // --- Doctype Registry ---

  registerDoctype(definition: DoctypeDefinition): void {
    this.doctypes.set(definition.name, definition);
    if (definition.defaultNamingSeries) {
      this.namingSeriesService.registerSeriesForDoctype(definition.name, [definition.defaultNamingSeries]);
    }
    logger.info(`Registered doctype: ${definition.name}`, { module: definition.module });
  }

  getDefinition(doctype: string): DoctypeDefinition {
    const def = this.doctypes.get(doctype);
    if (!def) {
      throw new BusinessRuleError(`Unknown doctype: ${doctype}`);
    }
    return def;
  }

  // --- Hooks & Validators Registration ---

  registerValidator<T extends BaseDocument>(doctype: string, validator: DocumentValidator<T>): void {
    if (!this.validators.has(doctype)) {
      this.validators.set(doctype, []);
    }
    this.validators.get(doctype)!.push(validator);
  }

  registerBeforeHook<T extends BaseDocument>(
    doctype: string,
    action: DocumentAction,
    hook: DocumentHook<T>
  ): void {
    if (!this.beforeHooks.has(doctype)) {
      this.beforeHooks.set(doctype, new Map());
    }
    const actionHooks = this.beforeHooks.get(doctype)!;
    if (!actionHooks.has(action)) {
      actionHooks.set(action, []);
    }
    actionHooks.get(action)!.push(hook);
  }

  registerAfterHook<T extends BaseDocument>(
    doctype: string,
    action: DocumentAction,
    hook: DocumentHook<T>
  ): void {
    if (!this.afterHooks.has(doctype)) {
      this.afterHooks.set(doctype, new Map());
    }
    const actionHooks = this.afterHooks.get(doctype)!;
    if (!actionHooks.has(action)) {
      actionHooks.set(action, []);
    }
    actionHooks.get(action)!.push(hook);
  }

  onEvent(type: DocumentEventType, handler: (event: DocumentEvent) => Promise<void>): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)!.push(handler);
  }

  // --- CRUD Operations ---

  async create<T extends BaseDocument>(
    doctype: string,
    data: Partial<T> & { items?: BaseDocumentItem[] | Record<string, unknown>[] },
    context: DocumentContext
  ): Promise<T> {
    const definition = this.getDefinition(doctype);
    const securityCtx = this.toSecurityContext(context);

    // 1. Permission check
    await this.permissionService.assertPermission('create', doctype, securityCtx, data);

    // 2. Generate document number
    const documentNumber = data.document_number || (await this.generateDocumentNumber(doctype, data, context));

    // 3. Compute fiscal year if not provided
    const postingDate = data.posting_date || new Date().toISOString().split('T')[0];
    const fyInfo = this.namingSeriesService.getFinancialYear(postingDate);
    const financialYear = data.financial_year || fyInfo.shortCode;

    const now = new Date().toISOString();
    const docToCreate = {
      ...data,
      doctype,
      document_number: documentNumber,
      tenant_id: context.tenantId,
      company_id: context.companyId,
      branch_id: data.branch_id || context.branchId,
      posting_date: postingDate,
      financial_year: financialYear,
      currency: data.currency || 'INR',
      exchange_rate: data.exchange_rate || '1',
      status: DocumentStatus.Draft,
      owner_id: context.userId,
      created_by: context.userId,
      updated_by: context.userId,
      created_at: now,
      updated_at: now,
      version: 1,
    } as T;

    // 4. Run validators
    await this.runValidators(doctype, docToCreate, context);

    // 5. Run before hooks (Save action)
    const processedDoc = await this.runBeforeHooks(doctype, DocumentAction.Save, docToCreate, context);

    // 6. Separate child collections if present (items, taxes)
    const { items, taxes, payment_schedule, ...headerData } = processedDoc as any;

    // 7. Insert parent document into database
    const insertResult = await this.db.insert<T>(definition.tableName, headerData as Record<string, unknown>);
    if (insertResult.error || !insertResult.data) {
      throw new BusinessRuleError(
        `Failed to create ${doctype}: ${insertResult.error?.message || 'Unknown database error'}`
      );
    }

    const createdDoc = insertResult.data;

    // 8. Insert child line items if supported
    if (definition.hasItems && definition.itemTableName && Array.isArray(items) && items.length > 0) {
      await this.saveChildItems(definition.itemTableName, createdDoc.id, doctype, items);
      (createdDoc as any).items = items;
    }

    // 9. Emit event
    const event: DocumentEvent = {
      type: DocumentEventType.Created,
      doctype,
      documentId: createdDoc.id,
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
      timestamp: now,
      newStatus: DocumentStatus.Draft,
      data: { documentNumber: createdDoc.document_number },
    };

    await this.dispatchEvent(event);

    // 10. MCA Rule 3 Audit Log
    await this.auditService.logDocumentChange({
      tenantId: context.tenantId,
      companyId: context.companyId,
      doctype,
      documentId: createdDoc.id,
      documentNumber: createdDoc.document_number,
      userId: context.userId,
      userEmail: context.userEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      newDoc: createdDoc as unknown as Record<string, unknown>,
    });

    // 11. Run after hooks
    await this.runAfterHooks(doctype, DocumentAction.Save, createdDoc, context);

    logger.info(`Created ${doctype}`, {
      doctype,
      documentId: createdDoc.id,
      documentNumber: createdDoc.document_number,
      tenantId: context.tenantId,
    });

    return createdDoc;
  }

  async update<T extends BaseDocument>(
    doctype: string,
    id: string,
    data: Partial<T>,
    context: DocumentContext
  ): Promise<T> {
    const definition = this.getDefinition(doctype);
    const securityCtx = this.toSecurityContext(context);

    // 1. Fetch existing record
    const existing = await this.getById<T>(doctype, id, context, { skipMasking: true });

    // 2. Immutability & Permission checks
    this.assertModifiable(existing);
    await this.permissionService.assertPermission('write', doctype, securityCtx, existing);
    this.permissionService.validateWritableFields(doctype, data as Record<string, unknown>, securityCtx);

    // 3. Prepare updated document
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...data,
      id: existing.id,
      tenant_id: existing.tenant_id,
      company_id: existing.company_id,
      doctype: existing.doctype,
      document_number: existing.document_number,
      updated_by: context.userId,
      updated_at: now,
      version: existing.version + 1,
    } as T;

    // 4. Run validators
    await this.runValidators(doctype, updated, context);

    // 5. Run before hooks
    const processedDoc = await this.runBeforeHooks(doctype, DocumentAction.Save, updated, context);

    // 6. Separate child collections
    const { items, taxes, payment_schedule, ...headerData } = processedDoc as any;

    // 7. Atomic optimistic concurrency update
    const updatedDoc = await this.executeOptimisticUpdate<T>(
      definition.tableName,
      id,
      existing.version,
      context.tenantId,
      headerData as Record<string, unknown>
    );

    // 8. Update child items if provided
    if (definition.hasItems && definition.itemTableName && Array.isArray(items)) {
      await this.saveChildItems(definition.itemTableName, id, doctype, items);
      (updatedDoc as any).items = items;
    }

    // 9. Dispatch event
    const event: DocumentEvent = {
      type: DocumentEventType.Updated,
      doctype,
      documentId: id,
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
      timestamp: now,
      data: { documentNumber: updatedDoc.document_number },
    };
    await this.dispatchEvent(event);

    // 10. Audit trail with granular diff
    await this.auditService.logDocumentChange({
      tenantId: context.tenantId,
      companyId: context.companyId,
      doctype,
      documentId: id,
      documentNumber: updatedDoc.document_number,
      userId: context.userId,
      userEmail: context.userEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      oldDoc: existing as unknown as Record<string, unknown>,
      newDoc: updatedDoc as unknown as Record<string, unknown>,
    });

    // 11. Run after hooks
    await this.runAfterHooks(doctype, DocumentAction.Save, updatedDoc, context);

    return updatedDoc;
  }

  async getById<T extends BaseDocument>(
    doctype: string,
    id: string,
    context: DocumentContext,
    options?: { loadItems?: boolean; skipMasking?: boolean }
  ): Promise<T> {
    const definition = this.getDefinition(doctype);
    const securityCtx = this.toSecurityContext(context);

    // Query parent record
    const result = await this.db.findById<T>(definition.tableName, id, {
      tenantId: context.tenantId,
    });

    if (!result.data) {
      throw new NotFoundError(doctype, id);
    }

    const doc = result.data;

    // Check read permission
    await this.permissionService.assertPermission('read', doctype, securityCtx, doc);

    // Optionally hydrate line items
    if (options?.loadItems !== false && definition.hasItems && definition.itemTableName) {
      const itemsResult = await this.db.findMany<BaseDocumentItem>(definition.itemTableName, {
        filters: [
          { column: 'parent_id', operator: 'eq', value: id },
          { column: 'parent_doctype', operator: 'eq', value: doctype },
        ],
        sort: [{ column: 'idx', direction: 'asc' }],
      });
      (doc as any).items = itemsResult.data || [];
    }

    if (options?.skipMasking) {
      return doc;
    }

    // Mask confidential fields
    return this.permissionService.maskDocumentFields(
      doctype,
      doc as unknown as Record<string, unknown>,
      securityCtx
    ) as unknown as T;
  }

  async list<T extends BaseDocument>(
    doctype: string,
    context: DocumentContext,
    options?: DocumentListOptions
  ): Promise<{ data: T[]; count: number }> {
    const definition = this.getDefinition(doctype);
    const securityCtx = this.toSecurityContext(context);

    await this.permissionService.assertPermission('read', doctype, securityCtx);

    const filters: QueryFilter[] = [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'company_id', operator: 'eq', value: context.companyId },
      { column: 'is_deleted', operator: 'is', value: null },
      ...(options?.filters || []).map((f) => ({
        column: f.column,
        operator: f.operator as any,
        value: f.value,
      })),
    ];

    const sort: QuerySort[] = options?.sort
      ? options.sort.map((s) => ({ column: s.column, direction: s.direction }))
      : [{ column: 'created_at', direction: 'desc' }];

    const result = await this.db.findMany<T>(definition.tableName, {
      filters,
      sort,
      pagination: options?.page ? { page: options.page, pageSize: options.pageSize || 20 } : undefined,
      select: options?.select,
    });

    const records = (result.data || []).map((doc) =>
      this.permissionService.maskDocumentFields(
        doctype,
        doc as unknown as Record<string, unknown>,
        securityCtx
      ) as unknown as T
    );

    return {
      data: records,
      count: result.count || records.length,
    };
  }

  // --- Lifecycle Transitions (State Machine) ---

  async transition<T extends BaseDocument>(
    doctype: string,
    id: string,
    action: DocumentAction,
    context: DocumentContext,
    options?: TransitionOptions
  ): Promise<T> {
    const definition = this.getDefinition(doctype);
    const doc = await this.getById<T>(doctype, id, context, { skipMasking: true });
    const securityCtx = this.toSecurityContext(context);

    // 1. Permission check for specific action
    const standardAction = this.mapDocumentActionToSecurityAction(action);
    await this.permissionService.assertPermission(standardAction, doctype, securityCtx, doc);

    // 2. Validate valid transition from current state
    const allowedActions = definition.transitions[doc.status] || VALID_TRANSITIONS[doc.status];
    if (!allowedActions || !allowedActions.includes(action)) {
      throw new BusinessRuleError(
        `Cannot perform '${action}' on ${doctype} in '${doc.status}' status. Allowed actions: ${
          allowedActions && allowedActions.length > 0 ? allowedActions.join(', ') : 'none'
        }`
      );
    }

    // 3. Accounting period lock validation on posting
    if (action === DocumentAction.Post && definition.hasAccounting) {
      await this.checkPeriodLock(doc.posting_date, context);
    }

    // 4. Run before hooks
    const processedDoc = await this.runBeforeHooks(doctype, action, doc, context);

    // 5. Target state calculation
    const newStatus = ACTION_RESULTS[action];
    if (!newStatus) {
      throw new BusinessRuleError(`No target status defined for action '${action}'`);
    }

    // 6. Build audit timestamps and transitions
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_by: context.userId,
      updated_at: now,
      version: processedDoc.version + 1,
    };

    switch (action) {
      case DocumentAction.Submit:
        updateData.submitted_by = context.userId;
        updateData.submitted_at = now;
        break;
      case DocumentAction.Approve:
        updateData.approved_by = context.userId;
        updateData.approved_at = now;
        break;
      case DocumentAction.Post:
        updateData.posted_by = context.userId;
        updateData.posted_at = now;
        break;
      case DocumentAction.Cancel:
        updateData.cancelled_by = context.userId;
        updateData.cancelled_at = now;
        updateData.cancellation_reason = options?.reason;
        break;
    }

    // 7. Atomic update with optimistic lock
    const updatedDoc = await this.executeOptimisticUpdate<T>(
      definition.tableName,
      id,
      processedDoc.version,
      context.tenantId,
      updateData
    );

    // 8. Event mapping and dispatch
    const eventTypeMap: Partial<Record<DocumentAction, DocumentEventType>> = {
      [DocumentAction.Submit]: DocumentEventType.Submitted,
      [DocumentAction.Approve]: DocumentEventType.Approved,
      [DocumentAction.Reject]: DocumentEventType.Rejected,
      [DocumentAction.Post]: DocumentEventType.Posted,
      [DocumentAction.Cancel]: DocumentEventType.Cancelled,
      [DocumentAction.Amend]: DocumentEventType.Amended,
      [DocumentAction.Close]: DocumentEventType.Closed,
      [DocumentAction.Reopen]: DocumentEventType.Reopened,
    };

    const eventType = eventTypeMap[action];
    if (eventType) {
      await this.dispatchEvent({
        type: eventType,
        doctype,
        documentId: id,
        tenantId: context.tenantId,
        companyId: context.companyId,
        userId: context.userId,
        timestamp: now,
        previousStatus: doc.status,
        newStatus,
        data: options?.metadata,
      });
    }

    // 9. MCA Rule 3 Transition Audit Log
    await this.auditService.logTransition({
      tenantId: context.tenantId,
      companyId: context.companyId,
      doctype,
      documentId: id,
      documentNumber: doc.document_number,
      userId: context.userId,
      userEmail: context.userEmail,
      action,
      previousStatus: doc.status,
      newStatus,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      comment: options?.comment,
      reason: options?.reason,
      metadata: options?.metadata,
    });

    // 10. Run after hooks
    await this.runAfterHooks(doctype, action, updatedDoc, context);

    logger.info(`${doctype} transitioned: ${doc.status} -> ${newStatus} (${action})`, {
      doctype,
      documentId: id,
      tenantId: context.tenantId,
      userId: context.userId,
    });

    return updatedDoc;
  }

  // --- Amendment Flow ---

  async amend<T extends BaseDocument>(
    doctype: string,
    id: string,
    context: DocumentContext
  ): Promise<T> {
    const original = await this.getById<T>(doctype, id, context, { skipMasking: true, loadItems: true });
    const definition = this.getDefinition(doctype);
    const securityCtx = this.toSecurityContext(context);

    await this.permissionService.assertPermission('amend', doctype, securityCtx, original);

    if (original.status !== DocumentStatus.Cancelled && original.status !== DocumentStatus.Closed) {
      throw new BusinessRuleError(
        `Can only amend Cancelled or Closed documents. Current status: '${original.status}'`
      );
    }

    // 1. Transition original document to Amended
    await this.transition(doctype, id, DocumentAction.Amend, context);

    // 2. Clone fields excluding identity & metadata
    const amendmentNumber = (original.amendment_number || 0) + 1;
    const {
      id: _id,
      document_number: _docNum,
      created_at: _ca,
      updated_at: _ua,
      created_by: _cb,
      updated_by: _ub,
      submitted_at: _sa,
      submitted_by: _sb,
      approved_at: _aa,
      approved_by: _ab,
      posted_at: _pa,
      posted_by: _pb,
      cancelled_at: _kla,
      cancelled_by: _klb,
      version: _ver,
      ...copyData
    } = original as any;

    // Generate amended document number e.g. DOC-0001-1
    const amendedDocumentNumber = `${original.document_number.split('-')[0]}-${original.document_number.split('-')[1] || ''}-${amendmentNumber}`;

    // 3. Create new amended document in Draft state
    const amended = await this.create<T>(
      doctype,
      {
        ...copyData,
        document_number: amendedDocumentNumber,
        amended_from: id,
        amendment_number: amendmentNumber,
        status: DocumentStatus.Draft,
      } as Partial<T>,
      context
    );

    // 4. Link original doc forward to new amended document
    await this.db.update(definition.tableName, id, { amended_to: amended.id });

    logger.info(`Amended ${doctype} (${id} -> ${amended.id})`, {
      originalId: id,
      amendedId: amended.id,
      amendmentNumber,
    });

    return amended;
  }

  // --- Soft Delete ---

  async softDelete(doctype: string, id: string, context: DocumentContext): Promise<void> {
    const doc = await this.getById(doctype, id, context, { skipMasking: true });
    const definition = this.getDefinition(doctype);
    const securityCtx = this.toSecurityContext(context);

    await this.permissionService.assertPermission('delete', doctype, securityCtx, doc);

    if (doc.status === DocumentStatus.Posted) {
      throw new ImmutableRecordError(doctype, id);
    }

    if (doc.status !== DocumentStatus.Draft && doc.status !== DocumentStatus.Cancelled) {
      throw new BusinessRuleError(
        `Can only delete documents in Draft or Cancelled status. Current status: '${doc.status}'`
      );
    }

    await this.db.softDelete(definition.tableName, id, context.userId, {
      tenantId: context.tenantId,
    });

    await this.auditService.logDocumentChange({
      tenantId: context.tenantId,
      companyId: context.companyId,
      doctype,
      documentId: id,
      documentNumber: doc.document_number,
      userId: context.userId,
      userEmail: context.userEmail,
      oldDoc: doc as unknown as Record<string, unknown>,
      newDoc: { ...doc, is_deleted: true, deleted_by: context.userId },
      comment: 'Document soft deleted',
    });

    logger.info(`Soft deleted ${doctype}`, {
      doctype,
      documentId: id,
      tenantId: context.tenantId,
    });
  }

  // --- Private Helper Methods ---

  private assertModifiable(doc: BaseDocument): void {
    const immutableStatuses: DocumentStatus[] = [
      DocumentStatus.Posted,
      DocumentStatus.Cancelled,
      DocumentStatus.Amended,
      DocumentStatus.Closed,
      DocumentStatus.Fulfilled,
    ];
    if (immutableStatuses.includes(doc.status)) {
      throw new ImmutableRecordError(doc.doctype, doc.id);
    }
  }

  private async runValidators<T extends BaseDocument>(
    doctype: string,
    doc: T,
    context: DocumentContext
  ): Promise<void> {
    const validators = this.validators.get(doctype) || [];
    const allErrors: Array<{ field: string; message: string }> = [];

    for (const validator of validators) {
      const result = await validator(doc, context);
      if (!result.valid) {
        allErrors.push(...result.errors);
      }
    }

    if (allErrors.length > 0) {
      const fieldMap: Record<string, string[]> = {};
      for (const err of allErrors) {
        if (!fieldMap[err.field]) fieldMap[err.field] = [];
        fieldMap[err.field].push(err.message);
      }
      throw new ValidationError('Document validation failed', fieldMap);
    }
  }

  private async runBeforeHooks<T extends BaseDocument>(
    doctype: string,
    action: DocumentAction,
    doc: T,
    context: DocumentContext
  ): Promise<T> {
    const hooks = this.beforeHooks.get(doctype)?.get(action) || [];
    let current = doc;
    for (const hook of hooks) {
      current = await hook(current, context);
    }
    return current;
  }

  private async runAfterHooks<T extends BaseDocument>(
    doctype: string,
    action: DocumentAction,
    doc: T,
    context: DocumentContext
  ): Promise<void> {
    const hooks = this.afterHooks.get(doctype)?.get(action) || [];
    for (const hook of hooks) {
      await hook(doc, context);
    }
  }

  private async dispatchEvent(event: DocumentEvent): Promise<void> {
    // 1. Emit to EventBus (pub/sub)
    await this.eventBus.emit(event);

    // 2. Emit to legacy inline event handlers registered on service
    const handlers = this.eventHandlers.get(event.type) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (err) {
        logger.error(`Document event handler failed for ${event.type}`, err as Error, {
          doctype: event.doctype,
          documentId: event.documentId,
        });
      }
    }
  }

  private async generateDocumentNumber(
    doctype: string,
    data: Partial<BaseDocument>,
    context: DocumentContext
  ): Promise<string> {
    const def = this.getDefinition(doctype);
    const seriesPattern =
      data.naming_series ||
      def.defaultNamingSeries ||
      `${doctype.toUpperCase().replace(/_/g, '-')}-.YYYY.-.####`;

    const namingCtx: NamingContext = {
      tenantId: context.tenantId,
      companyId: context.companyId,
      branchId: context.branchId,
      companyCode: context.companyCode,
      branchCode: context.branchCode,
      postingDate: data.posting_date,
    };

    return this.namingSeriesService.getNextNumber(seriesPattern, namingCtx);
  }

  private async checkPeriodLock(postingDate: string, context: DocumentContext): Promise<void> {
    const res = await this.db.findOne<{ id: string; period_name?: string }>('period_lock', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'company_id', operator: 'eq', value: context.companyId },
      { column: 'start_date', operator: 'lte', value: postingDate },
      { column: 'end_date', operator: 'gte', value: postingDate },
      { column: 'is_locked', operator: 'eq', value: true },
    ]);

    if (res.data) {
      const periodLabel = (res.data as Record<string, unknown>).period_name
        ? `${(res.data as Record<string, unknown>).period_name} (${postingDate})`
        : postingDate;
      throw new PeriodClosedError(periodLabel);
    }
  }

  private async saveChildItems(
    itemTable: string,
    parentId: string,
    parentDoctype: string,
    items: BaseDocumentItem[]
  ): Promise<void> {
    // Delete existing child records for parent to guarantee idempotency on updates
    await this.db.raw(`DELETE FROM ${itemTable} WHERE parent_id = $1 AND parent_doctype = $2`, [
      parentId,
      parentDoctype,
    ]);

    // Insert updated child lines with sequential idx
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const itemRecord: Record<string, unknown> = {
        ...item,
        parent_id: parentId,
        parent_doctype: parentDoctype,
        idx: idx + 1,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await this.db.insert(itemTable, itemRecord);
    }
  }

  /**
   * Safe, fully-parameterized optimistic SQL update.
   */
  private async executeOptimisticUpdate<T>(
    tableName: string,
    id: string,
    expectedVersion: number,
    tenantId: string,
    updateFields: Record<string, unknown>
  ): Promise<T> {
    // Sanitize columns against SQL injection
    const validKeys = Object.keys(updateFields).filter(
      (k) => k !== 'id' && /^[a-zA-Z0-9_]+$/.test(k)
    );

    if (validKeys.length === 0) {
      throw new BusinessRuleError('No valid columns provided for update');
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];

    validKeys.forEach((key, i) => {
      setClauses.push(`${key} = $${i + 1}`);
      params.push(updateFields[key]);
    });

    const nextIndex = validKeys.length + 1;
    const whereClauses = [
      `id = $${nextIndex}`,
      `version = $${nextIndex + 1}`,
      `tenant_id = $${nextIndex + 2}`,
    ];
    params.push(id, expectedVersion, tenantId);

    const sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING *`;

    const result = await this.db.raw<T>(sql, params);
    if (!result.data || result.data.length === 0) {
      throw new ConcurrencyError();
    }

    return result.data[0];
  }

  private toSecurityContext(context: DocumentContext): UserSecurityContext {
    return {
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
      roles: context.roles,
      allowedCompanyIds: context.allowedCompanyIds,
      allowedBranchIds: context.allowedBranchIds,
      allowedWarehouseIds: context.allowedWarehouseIds,
      approvalLimits: context.approvalLimits,
    };
  }

  private mapDocumentActionToSecurityAction(action: DocumentAction): StandardAction {
    switch (action) {
      case DocumentAction.Save:
        return 'write';
      case DocumentAction.Submit:
        return 'submit';
      case DocumentAction.Approve:
        return 'approve';
      case DocumentAction.Reject:
        return 'approve'; // Review authorization
      case DocumentAction.Post:
        return 'submit';
      case DocumentAction.Cancel:
        return 'cancel';
      case DocumentAction.Amend:
        return 'amend';
      case DocumentAction.Close:
      case DocumentAction.Hold:
      case DocumentAction.Resume:
      case DocumentAction.Reopen:
        return 'write';
      default:
        return 'write';
    }
  }
}
