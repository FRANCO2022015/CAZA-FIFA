package com.caza.service.interfaces;

import com.caza.dto.request.MeetingRequest;
import com.caza.dto.response.MeetingResponse;

import java.util.List;

public interface MeetingService {

    MeetingResponse createMeeting(Long userId, MeetingRequest request);

    List<MeetingResponse> getUserMeetings(Long userId);

    List<MeetingResponse> getAllMeetings();

    void deleteMeeting(Long meetingId, Long userId, boolean isAdmin);
}
