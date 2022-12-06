const DetailComment = require('../../Domains/comments/entities/DetailComment')
const DetailThread = require('../../Domains/threads/entities/DetailThread')
const DetailReply = require('../../Domains/replies/entities/DetailReply')

class GetDetailThreadUseCase {
  constructor ({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository
    this._commentRepository = commentRepository
    this._replyRepository = replyRepository
  }

  async execute (useCasePayload) {
    const { threadId } = useCasePayload

    await this._threadRepository.checkAvailabilityThread(threadId)
    const detailThread = await this._threadRepository.getThreadById(threadId)
    const comments = await this._commentRepository.getCommentsByThreadId(threadId)
    const checkedComments = await Promise.all(comments.map(async (detailComment) => {
      if (detailComment.is_delete) {
        detailComment.content = '**komentar telah dihapus**'
      }
      const comment = new DetailComment(detailComment)
      const replies = await this._replyRepository.getRepliesByCommentId(comment.id)
      const checkedReplies = replies.map((detailReply) => {
        if (detailReply.is_delete) {
          detailReply.content = '**balasan telah dihapus**'
        }
        const reply = new DetailReply(detailReply)
        return reply
      })
      return { ...comment, replies: checkedReplies }
    }))

    return new DetailThread({
      ...detailThread,
      comments: checkedComments
    })
  }
}

module.exports = GetDetailThreadUseCase
