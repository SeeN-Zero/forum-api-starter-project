const AddReply = require('../../Domains/replies/entities/AddReply')

class AddReplyUseCase {
  constructor ({ replyRepository, commentRepository, threadRepository }) {
    this._replyRepository = replyRepository
    this._commentRepository = commentRepository
    this._threadRepository = threadRepository
  }

  async execute (useCasePayload) {
    await this._threadRepository.checkAvailabilityThread(useCasePayload.threadId)
    await this._commentRepository.checkAvailabilityComment(useCasePayload.commentId)

    const newReply = new AddReply(useCasePayload)
    return this._replyRepository.addReply(newReply)
  }
}

module.exports = AddReplyUseCase
