package com.caza.service.impl;

import com.caza.dto.request.CommentRequest;
import com.caza.dto.response.CommentResponse;
import com.caza.dto.response.PagedResponse;
import com.caza.exception.ResourceNotFoundException;
import com.caza.exception.UnauthorizedException;
import com.caza.model.Comment;
import com.caza.model.Player;
import com.caza.model.User;
import com.caza.repository.CommentRepository;
import com.caza.repository.PlayerRepository;
import com.caza.repository.UserRepository;
import com.caza.service.interfaces.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<CommentResponse> getByPlayer(Long playerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("fecha").descending());
        Page<Comment> comments = commentRepository.findByPlayerIdAndActivoTrue(playerId, pageable);
        Page<CommentResponse> mapped = comments.map(this::mapToResponse);
        return PagedResponse.of(mapped);
    }

    @Override
    public CommentResponse addComment(Long userId, Long playerId, CommentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "id", playerId));

        Comment comment = Comment.builder()
                .contenido(request.contenido())
                .rating(request.rating())
                .user(user)
                .player(player)
                .activo(true)
                .build();

        return mapToResponse(commentRepository.save(comment));
    }

    @Override
    public void deleteComment(Long commentId, Long userId, boolean isAdmin) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        if (!isAdmin && !comment.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("No tienes permisos para eliminar este comentario");
        }

        comment.setActivo(false);
        commentRepository.save(comment);
    }

    private CommentResponse mapToResponse(Comment c) {
        return new CommentResponse(
                c.getId(),
                c.getContenido(),
                c.getRating(),
                c.getFecha(),
                c.getActivo(),
                c.getUser().getNombre(),
                c.getUser().getId(),
                c.getPlayer().getId()
        );
    }
}
