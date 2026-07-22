package com.caza.service.interfaces;

import com.caza.dto.request.ForumPostRequest;
import com.caza.dto.request.ForumThreadRequest;
import com.caza.dto.response.ForumPostResponse;
import com.caza.dto.response.ForumThreadResponse;
import com.caza.dto.response.PagedResponse;

import java.util.List;

public interface ForumService {

    PagedResponse<ForumThreadResponse> getAllThreads(int page, int size);

    ForumThreadResponse getThreadById(Long id);

    ForumThreadResponse createThread(Long userId, ForumThreadRequest request);

    void deleteThread(Long threadId, Long userId, boolean isAdmin);

    List<ForumPostResponse> getPostsByThread(Long threadId);

    ForumPostResponse createPost(Long threadId, Long userId, ForumPostRequest request);

    ForumPostResponse updatePost(Long postId, Long userId, boolean isAdmin, ForumPostRequest request);

    void deletePost(Long postId, Long userId, boolean isAdmin);
}
