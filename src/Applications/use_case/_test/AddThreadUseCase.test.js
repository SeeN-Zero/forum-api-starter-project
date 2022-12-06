const AddThreadUseCase = require('../AddThreadUseCase')
const ThreadRepository = require('../../../Domains/threads/ThreadRepository')
const AddThread = require('../../../Domains/threads/entities/AddThread')

describe('AddThreadUseCase', () => {
  it('should orchestrating the add thread action correctly', async () => {
    // Assert
    const useCasePayload = {
      title: 'Title',
      body: 'Body',
      owner: 'user-666'
    }

    const expectedAddedThread = {
      id: 'thread-666',
      title: 'Title',
      owner: 'user-666'
    }

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository()

    /** mocking needed function */
    mockThreadRepository.addThread = jest.fn()
      .mockImplementation(() => Promise.resolve({
        id: 'thread-666',
        title: 'Title',
        owner: 'user-666'
      }
      ))

    /** creating use case instance */
    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository
    })

    // Action
    const addedThread = await addThreadUseCase.execute(useCasePayload)

    // Assert
    expect(addedThread).toStrictEqual(expectedAddedThread)
    expect(mockThreadRepository.addThread).toBeCalledWith(new AddThread({
      title: useCasePayload.title,
      body: useCasePayload.body,
      owner: useCasePayload.owner
    }))
  })
})
