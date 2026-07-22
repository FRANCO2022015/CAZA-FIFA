package com.caza.service.impl;

import com.caza.dto.request.MeetingRequest;
import com.caza.dto.response.MeetingResponse;
import com.caza.exception.ResourceNotFoundException;
import com.caza.exception.UnauthorizedException;
import com.caza.model.Meeting;
import com.caza.model.User;
import com.caza.repository.MeetingRepository;
import com.caza.repository.UserRepository;
import com.caza.service.interfaces.MeetingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MeetingServiceImpl implements MeetingService {

    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;

    @Override
    public MeetingResponse createMeeting(Long userId, MeetingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Meeting meeting = Meeting.builder()
                .url(request.url())
                .fechaInicio(request.fechaInicio())
                .fechaFin(request.fechaFin())
                .tema(request.tema())
                .user(user)
                .activo(true)
                .build();
        return mapToResponse(meetingRepository.save(meeting));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MeetingResponse> getUserMeetings(Long userId) {
        return meetingRepository.findByUserIdAndActivoTrueOrderByFechaInicioDesc(userId)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MeetingResponse> getAllMeetings() {
        return meetingRepository.findAllByActivoTrueOrderByFechaInicioDesc()
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    public void deleteMeeting(Long meetingId, Long userId, boolean isAdmin) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", meetingId));
        if (!isAdmin && !meeting.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("No tienes permisos para eliminar esta reunión");
        }
        meeting.setActivo(false);
        meetingRepository.save(meeting);
    }

    private MeetingResponse mapToResponse(Meeting m) {
        return new MeetingResponse(
                m.getId(), m.getUrl(), m.getFechaInicio(), m.getFechaFin(),
                m.getTema(), m.getActivo(), m.getUser().getNombre(), m.getUser().getId()
        );
    }
}
