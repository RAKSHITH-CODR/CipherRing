const REQUIRED_COLS = ['transaction_id','sender_id','receiver_id','amount','timestamp'];

export function validateCsv(headers) {
  return REQUIRED_COLS.filter(col => !headers.includes(col));
}
