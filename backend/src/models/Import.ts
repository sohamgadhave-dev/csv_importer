/**
 * Mongoose model for import records.
 * Each document represents one CSV import session, containing the
 * original filename, processing stats, and all extracted CRM records.
 */

import mongoose, { Schema, Document } from 'mongoose';
import type { CRMRecord, SkippedRecord } from '../types/crm';

export interface IImport extends Document {
  browserId: string;
  originalFilename: string;
  totalImported: number;
  totalSkipped: number;
  crmRecords: CRMRecord[];
  skippedRecords: SkippedRecord[];
  createdAt: Date;
}

const ImportSchema = new Schema(
  {
    browserId: {
      type: String,
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    totalImported: {
      type: Number,
      required: true,
    },
    totalSkipped: {
      type: Number,
      required: true,
    },
    crmRecords: {
      type: [Schema.Types.Mixed],
      required: true,
      default: [],
    },
    skippedRecords: {
      type: [Schema.Types.Mixed],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Compound index for efficient browserId + date queries
ImportSchema.index({ browserId: 1, createdAt: -1 });

export const Import = mongoose.model<IImport>('Import', ImportSchema);
