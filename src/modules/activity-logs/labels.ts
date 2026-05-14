/** Bangla labels for audit summaries (job / invoice). */
export const jobStatusBn: Record<string, string> = {
  pending: "অপেক্ষমান",
  in_progress: "চলমান",
  completed: "সম্পন্ন",
  delivered: "ডেলিভারি",
  cancelled: "বাতিল",
};

export const invoiceStatusBn: Record<string, string> = {
  draft: "ড্রাফট",
  unpaid: "বকেয়া",
  partial: "আংশিক",
  paid: "পরিশোধিত",
  cancelled: "বাতিল",
};

export const paymentMethodBn: Record<string, string> = {
  cash: "নগদ",
  bkash: "বিকাশ",
  nagad: "নগাদ",
  rocket: "রকেট",
  bank: "ব্যাংক",
  card: "কার্ড",
  other: "অন্যান্য",
};
