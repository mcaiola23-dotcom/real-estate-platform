export type TransactionStatus =
  | 'under_contract'
  | 'inspection'
  | 'appraisal'
  | 'title'
  | 'closing'
  | 'closed'
  | 'fallen_through';

export type TransactionSide = 'buyer' | 'seller' | 'dual';

export type TransactionPartyRole =
  | 'buyer'
  | 'seller'
  | 'buyer_agent'
  | 'seller_agent'
  | 'lender'
  | 'attorney'
  | 'title_company'
  | 'inspector'
  | 'appraiser'
  | 'other';

export type TransactionDocumentStatus = 'pending' | 'received' | 'reviewed' | 'approved';

export type TransactionMilestoneType =
  | 'contract_signed'
  | 'earnest_money_deposited'
  | 'inspection_scheduled'
  | 'inspection_completed'
  | 'appraisal_ordered'
  | 'appraisal_completed'
  | 'title_search'
  | 'title_cleared'
  | 'loan_approval'
  | 'final_walkthrough'
  | 'closing_scheduled'
  | 'closing_completed'
  | 'possession_transferred';

export interface CrmTransaction {
  id: string;
  tenantId: string;
  leadId: string | null;
  contactId: string | null;
  propertyAddress: string;
  status: TransactionStatus;
  side: TransactionSide;
  salePrice: number | null;
  listPrice: number | null;
  closingDate: string | null;
  contractDate: string | null;
  inspectionDate: string | null;
  appraisalDate: string | null;
  titleDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmTransactionWithRelations extends CrmTransaction {
  parties: CrmTransactionParty[];
  documents: CrmTransactionDocument[];
  milestones: CrmTransactionMilestone[];
}

export interface CrmTransactionParty {
  id: string;
  transactionId: string;
  tenantId: string;
  role: TransactionPartyRole;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmTransactionDocument {
  id: string;
  transactionId: string;
  tenantId: string;
  documentType: string;
  fileName: string;
  status: TransactionDocumentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmTransactionMilestone {
  id: string;
  transactionId: string;
  tenantId: string;
  milestoneType: TransactionMilestoneType;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmTransactionListQuery {
  status?: TransactionStatus;
  side?: TransactionSide;
  limit?: number;
  offset?: number;
}

export interface CrmTransactionCreateInput {
  leadId?: string | null;
  contactId?: string | null;
  propertyAddress: string;
  status?: TransactionStatus;
  side: TransactionSide;
  salePrice?: number | null;
  listPrice?: number | null;
  closingDate?: string | null;
  contractDate?: string | null;
  inspectionDate?: string | null;
  appraisalDate?: string | null;
  titleDate?: string | null;
  notes?: string | null;
}

export interface CrmTransactionUpdateInput {
  propertyAddress?: string;
  status?: TransactionStatus;
  side?: TransactionSide;
  salePrice?: number | null;
  listPrice?: number | null;
  closingDate?: string | null;
  contractDate?: string | null;
  inspectionDate?: string | null;
  appraisalDate?: string | null;
  titleDate?: string | null;
  notes?: string | null;
}
