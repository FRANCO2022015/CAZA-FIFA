package com.caza.service.impl;

import com.caza.dto.request.ForumPostRequest;
import com.caza.dto.request.ForumThreadRequest;
import com.caza.dto.response.ForumPostResponse;
import com.caza.dto.response.ForumThreadResponse;
import com.caza.dto.response.PagedResponse;
import com.caza.exception.ResourceNotFoundException;
import com.caza.exception.UnauthorizedException;
import com.caza.model.ForumPost;
import com.caza.model.ForumThread;
import com.caza.model.User;
import com.caza.repository.ForumPostRepository;
import com.caza.repository.ForumThreadRepository;
import com.caza.repository.UserRepository;
import com.caza.service.interfaces.ForumService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ForumServiceImpl implements ForumService {

    private final ForumThreadRepository threadRepository;
    private final ForumPostRepository postRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ForumThreadResponse> getAllThreads(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ForumThread> threads = threadRepository.findByActivoTrueOrderByFechaCreacionDesc(pageable);
        Page<ForumThreadResponse> mapped = threads.map(this::mapThreadToResponse);
        return PagedResponse.of(mapped);
    }

    @Override
    @Transactional(readOnly = true)
    public ForumThreadResponse getThreadById(Long id) {
        ForumThread thread = threadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ForumThread", "id", id));
        return mapThreadToResponse(thread);
    }

    @Override
    public ForumThreadResponse createThread(Long userId, ForumThreadRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        ForumThread thread = ForumThread.builder()
                .titulo(request.titulo())
                .descripcion(request.descripcion())
                .user(user)
                .activo(true)
                .build();
        return mapThreadToResponse(threadRepository.save(thread));
    }

    @Override
    public void deleteThread(Long threadId, Long userId, boolean isAdmin) {
        ForumThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("ForumThread", "id", threadId));
        if (!isAdmin && !thread.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("No tienes permisos para eliminar este hilo");
        }
        thread.setActivo(false);
        threadRepository.save(thread);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ForumPostResponse> getPostsByThread(Long threadId) {
        return postRepository.findByThreadIdAndActivoTrueOrderByFechaPublicacionAsc(threadId)
                .stream().map(this::mapPostToResponse).toList();
    }

    @Override
    public ForumPostResponse createPost(Long threadId, Long userId, ForumPostRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        ForumThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("ForumThread", "id", threadId));
        ForumPost post = ForumPost.builder()
                .contenido(request.contenido())
                .user(user)
                .thread(thread)
                .activo(true)
                .build();
        return mapPostToResponse(postRepository.save(post));
    }

    @Override
    public ForumPostResponse updatePost(Long postId, Long userId, boolean isAdmin, ForumPostRequest request) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("ForumPost", "id", postId));
        if (!isAdmin && !post.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("No tienes permisos para editar este post");
        }
        post.setContenido(request.contenido());
        return mapPostToResponse(postRepository.save(post));
    }

    @Override
    public void deletePost(Long postId, Long userId, boolean isAdmin) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("ForumPost", "id", postId));
        if (!isAdmin && !post.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("No tienes permisos para eliminar este post");
        }
        post.setActivo(false);
        postRepository.save(post);
    }

    private ForumThreadResponse mapThreadToResponse(ForumThread t) {
        int postCount = (t.getPosts() != null)
                ? (int) t.getPosts().stream().filter(p -> Boolean.TRUE.equals(p.getActivo())).count()
                : 0;
        return ForumThreadResponse.builder()
                .id(t.getId())
                .titulo(t.getTitulo())
                .descripcion(t.getDescripcion())
                .fechaCreacion(t.getFechaCreacion())
                .activo(t.getActivo())
                .userName(t.getUser().getNombre())
                .userId(t.getUser().getId())
                .postCount(postCount)
                .build();
    }

    private ForumPostResponse mapPostToResponse(ForumPost p) {
        return new ForumPostResponse(
                p.getId(), p.getContenido(), p.getFechaPublicacion(),
                p.getActivo(), p.getUser().getNombre(), p.getUser().getId(), p.getThread().getId()
        );
    }
}
