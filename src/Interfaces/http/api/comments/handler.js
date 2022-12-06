const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase')
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase')

class CommentHandler {
  constructor (container) {
    this._container = container
    this.postCommentHandler = this.postCommentHandler.bind(this)
    this.deleteCommentHandler = this.deleteCommentHandler.bind(this)
  }

  async postCommentHandler (request, h) {
    const { id: owner } = request.auth.credentials
    const { threadId } = request.params
    const addedCommentUseCase = this._container.getInstance(AddCommentUseCase.name)
    const addedComment = await addedCommentUseCase.execute({ ...request.payload, owner, threadId })

    const response = h.response({
      status: 'success',
      data: {
        addedComment
      }
    })
    response.code(201)
    return response
  }

  async deleteCommentHandler (request, h) {
    const { id: owner } = request.auth.credentials
    const { threadId, commentId } = request.params
    const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name)
    await deleteCommentUseCase.execute({ owner, threadId, commentId })

    const response = h.response({
      status: 'success',
      message: 'berhasil delete'
    })
    return response
  }
}

module.exports = CommentHandler
