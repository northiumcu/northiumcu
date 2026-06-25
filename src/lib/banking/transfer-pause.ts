export class TransferPausedError extends Error {
  readonly memberMessage: string;

  constructor(memberMessage: string) {
    super(memberMessage);
    this.name = "TransferPausedError";
    this.memberMessage = memberMessage;
  }
}

export const DEFAULT_TRANSFER_PAUSE_MESSAGE =
  "This transfer could not be completed at this time. Please contact your Northium account officer for assistance.";

export const TRANSACTION_INCOMPLETE_TITLE = "Unable to complete transaction";
