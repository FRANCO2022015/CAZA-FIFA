package com.caza.service.interfaces;

import com.caza.dto.request.CommentRequest;
import com.caza.dto.response.CommentResponse;
import com.caza.dto.response.PagedResponse;

public interface CommentService {

    PagedResponse<CommentResponse> getByPlayer(Long playerId, int page, int size);

    CommentResponse addComment(Long userId, Long playerId, CommentRequest request);

    void deleteComment(Long commentId, Long userId, boolean isAdmin);
}
