package com.caza.controller;

import com.caza.dto.request.CommentRequest;
import com.caza.dto.response.ApiResponse;
import com.caza.dto.response.CommentResponse;
import com.caza.dto.response.PagedResponse;
import com.caza.model.User;
import com.caza.service.interfaces.CommentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Player comment endpoints")
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/api/players/{playerId}/comments")
    public ResponseEntity<ApiResponse<PagedResponse<CommentResponse>>> getByPlayer(
            @PathVariable Long playerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(commentService.getByPlayer(playerId, page, size)));
    }

    @PostMapping("/api/players/{playerId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long playerId,
            @Valid @RequestBody CommentRequest request) {
        CommentResponse response = commentService.addComment(user.getId(), playerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Comentario añadido", response));
    }

    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long commentId) {
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        commentService.deleteComment(commentId, user.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Comentario eliminado", null));
    }
}
