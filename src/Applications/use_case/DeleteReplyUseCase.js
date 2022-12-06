class DeleteReplyUseCase {
  constructor ({ replyRepository, commentRepository, threadRepository }) {
    this._replyRepository = replyRepository
    this._commentRepository = commentRepository
    this._threadRepository = threadRepository
  }

  async execute (useCasePayload) {
    this._verifyPayload(useCasePayload)
    const { owner, threadId, commentId, replyId } = useCasePayload

    await this._threadRepository.checkAvailabilityThread(threadId)
    await this._commentRepository.checkAvailabilityComment(commentId)
    await this._replyRepository.checkAvailabilityReply(replyId)
    await this._replyRepository.verifyReplyAccess({ owner, replyId })
    await this._replyRepository.deleteReply(replyId)
  }

  _verifyPayload (payload) {
    const { owner, threadId, commentId, replyId } = payload

    if (!owner || !threadId || !commentId || !replyId) {
      throw new Error('DELETE_REPLY_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY')
    }

    if (typeof owner !== 'string' || typeof threadId !== 'string' || typeof commentId !== 'string' ||
        typeof replyId !== 'string') {
      throw new Error('DELETE_REPLY_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION')
    }
  }
}

module.exports = DeleteReplyUseCase
