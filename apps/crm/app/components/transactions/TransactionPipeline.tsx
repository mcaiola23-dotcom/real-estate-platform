'use client';

import type { CrmTransaction, TransactionStatus } from '@real-estate/types';
import { TransactionCard } from './TransactionCard';

const PIPELINE_STAGES: Array<{ status: TransactionStatus; label: string }> = [
  { status: 'under_contract', label: 'Under Contract' },
  { status: 'inspection', label: 'Inspection' },
  { status: 'appraisal', label: 'Appraisal' },
  { status: 'title', label: 'Title' },
  { status: 'closing', label: 'Closing' },
  { status: 'closed', label: 'Closed' },
  { status: 'fallen_through', label: 'Fallen Through' },
];

interface TransactionPipelineProps {
  transactions: CrmTransaction[];
  onSelectTransaction: (txn: CrmTransaction) => void;
}

export function TransactionPipeline({ transactions, onSelectTransaction }: TransactionPipelineProps) {
  const byStatus = new Map<TransactionStatus, CrmTransaction[]>();
  for (const stage of PIPELINE_STAGES) {
    byStatus.set(stage.status, []);
  }
  for (const txn of transactions) {
    const list = byStatus.get(txn.status);
    if (list) {
      list.push(txn);
    }
  }

  return (
    <div className="crm-txn-pipeline">
      {PIPELINE_STAGES.map((stage) => {
        const items = byStatus.get(stage.status) ?? [];
        return (
          <div key={stage.status} className={`crm-txn-pipeline-col crm-txn-pipeline-col--${stage.status}`}>
            <div className="crm-txn-pipeline-col-header">
              <span className="crm-txn-pipeline-col-label">{stage.label}</span>
              <span className="crm-txn-pipeline-col-count">{items.length}</span>
            </div>
            <div className="crm-txn-pipeline-col-body">
              {items.map((txn) => (
                <TransactionCard
                  key={txn.id}
                  transaction={txn}
                  onClick={() => onSelectTransaction(txn)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
