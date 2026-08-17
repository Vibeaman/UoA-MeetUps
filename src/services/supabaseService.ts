import { getSupabase } from '../lib/supabase';
import {
  UserProfile,
  CampusStory,
  VerificationRequest,
  UserReport,
  GossipPost,
  GossipComment,
  CampusPoll,
  ChatMessage,
  MatchItem,
} from '../types';

/**
 * Service for syncing UniAbuja MeetUps data with Supabase PostgreSQL
 */
const USER_MEDIA_BUCKET = 'user-media';

const getFileExtension = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) ? extension : 'jpg';
};

export const supabaseService = {
  async uploadUserMedia(file: File, userId: string, folder: 'profiles' | 'gossip' | 'verification' | 'chat') {
    if (!file.type.startsWith('image/')) {
      return { url: null, error: 'Please choose an image file.' };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { url: null, error: 'Images must be smaller than 10 MB.' };
    }

    try {
      const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_') || 'anonymous';
      const filePath = `${safeUserId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${getFileExtension(file)}`;
      const supabase = getSupabase();
      const { error: uploadError } = await supabase.storage.from(USER_MEDIA_BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });

      if (uploadError) {
        return { url: null, error: uploadError.message };
      }

      const { data } = supabase.storage.from(USER_MEDIA_BUCKET).getPublicUrl(filePath);
      return { url: data.publicUrl, error: null };
    } catch (error) {
      return {
        url: null,
        error: error instanceof Error ? error.message : 'Image upload failed. Please try again.',
      };
    }
  },


  // Test connection to Supabase
  async checkConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      if (error) {
        return {
          connected: false,
          message: `Supabase database check failed: ${error.message}`,
        };
      }
      return {
        connected: true,
        message: 'Connected to Supabase successfully',
      };
    } catch (err: any) {
      return {
        connected: false,
        message: err?.message || 'Failed to connect to Supabase',
      };
    }
  },

  // Fetch only real profiles; empty Supabase results remain empty.
  async fetchProfiles(): Promise<UserProfile[] | null> {
    try {
      const { data, error } = await getSupabase().from('profiles').select('*').order('created_at', { ascending: false });
      if (error) {
        console.warn('Supabase profiles query notice:', error.message);
        return null;
      }

      return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        age: r.age,
        matricNumber: r.matric_number,
        gender: r.gender || 'Prefer not to say',
        faculty: r.faculty,
        course: r.course || r.department || '',
        department: r.department,
        level: r.level,
        campusLocation: r.campus_location,
        bio: r.bio || '',
        photos: Array.isArray(r.photos) ? r.photos : [],
        interests: Array.isArray(r.interests) ? r.interests : [],
        lookingFor: r.looking_for,
        mode: r.mode || 'normal',
        isVerified: Boolean(r.is_verified),
        verificationStatus: r.verification_status || 'unverified',
        icebreakerPrompts: Array.isArray(r.icebreaker_prompts) ? r.icebreaker_prompts : [],
        badges: Array.isArray(r.badges) ? r.badges : [],
        isBanned: Boolean(r.is_banned),
        lastActive: r.last_active ? new Date(r.last_active).toLocaleString() : '',
        isOnline: Boolean(r.is_online),
        instagramHandle: r.instagram || undefined,
        snapchatHandle: r.snapchat || undefined,
      }));
    } catch (error) {
      console.warn('Supabase profiles fetch error:', error);
      return null;
    }
  },

  async fetchProfile(userId: string): Promise<UserProfile | null> {
    const profiles = await this.fetchProfiles();
    return profiles?.find((profile) => profile.id === userId) || null;
  },

  async fetchCampusStories(): Promise<CampusStory[] | null> {
    try {
      const supabase = getSupabase();
      const { data: storyRows, error } = await supabase
        .from('campus_stories')
        .select('id, user_id, story_image, caption, tag, created_at, expires_at')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('Supabase stories fetch notice:', error.message);
        return null;
      }

      const userIds = [...new Set((storyRows || []).map((row: any) => row.user_id).filter(Boolean))];
      const { data: profileRows, error: profileError } = userIds.length
        ? await supabase.from('profiles').select('id, name, photos, department, level').in('id', userIds)
        : { data: [], error: null };
      if (profileError) {
        console.warn('Supabase story author fetch notice:', profileError.message);
      }
      const profileMap = new Map((profileRows || []).map((profile: any) => [profile.id, profile]));

      return (storyRows || []).flatMap((row: any) => {
        const profile = profileMap.get(row.user_id);
        if (!profile) return [];
        return [{
          id: row.id,
          userId: row.user_id,
          userName: profile.name,
          avatar: Array.isArray(profile.photos) ? profile.photos[0] || '' : '',
          storyImage: row.story_image,
          caption: row.caption,
          tag: row.tag,
          postedAt: row.created_at ? new Date(row.created_at).toLocaleString() : '',
          department: profile.department || '',
          level: profile.level || '',
        } satisfies CampusStory];
      });
    } catch (error) {
      console.warn('Supabase stories fetch error:', error);
      return null;
    }
  },

  async createCampusStory(story: CampusStory): Promise<CampusStory | null> {
    try {
      const { data, error } = await getSupabase()
        .from('campus_stories')
        .insert({
          id: story.id,
          user_id: story.userId,
          story_image: story.storyImage,
          caption: story.caption,
          tag: story.tag,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id, user_id, story_image, caption, tag, created_at, expires_at')
        .single();
      if (error || !data) {
        console.warn('Supabase story insert error:', error?.message || 'No story returned.');
        return null;
      }
      return { ...story, id: data.id, postedAt: data.created_at ? new Date(data.created_at).toLocaleString() : '' };
    } catch (error) {
      console.warn('Supabase story insert exception:', error);
      return null;
    }
  },

  // Save / Update User Profile
  async upsertProfile(profile: UserProfile): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const row = {
        id: profile.id,
        name: profile.name,
        age: profile.age,
        matric_number: profile.matricNumber,
        faculty: profile.faculty,
        department: profile.department,
        level: profile.level,
        campus_location: profile.campusLocation,
        bio: profile.bio,
        photos: profile.photos,
        interests: profile.interests,
        looking_for: profile.lookingFor,
        mode: profile.mode,
        is_verified: profile.isVerified,
        verification_status: profile.verificationStatus,
        badges: profile.badges,
        is_banned: profile.isBanned,
        instagram: profile.instagramHandle || null,
        snapchat: profile.snapchatHandle || null,
        phone_whatsapp: null,
      };

      const { error } = await supabase.from('profiles').upsert(row);
      if (error) {
        console.warn('Supabase upsert profile error:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Submit Verification Request
  async submitVerification(req: VerificationRequest): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const row = {
        id: req.id,
        user_id: req.userId,
        user_name: req.userName,
        matric_number: req.matricNumber,
        faculty: req.faculty,
        department: req.department,
        profile_photo: req.profilePhoto,
        live_selfie_photo: req.liveSelfiePhoto,
        student_id_photo: req.studentIdPhoto || null,
        status: req.status,
        submitted_at: new Date(req.submittedAt).toISOString(),
      };

      const { error } = await supabase.from('verification_requests').insert(row);
      if (error) {
        console.warn('Supabase verification insert error:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Update Verification Status (Admin)
  async updateVerificationStatus(
    reqId: string,
    status: 'approved' | 'rejected',
    adminNote?: string
  ): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status,
          admin_note: adminNote || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reqId);

      if (error) {
        console.warn('Supabase verification update error:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Submit User Report
  async submitReport(report: UserReport): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const row = {
        id: report.id,
        reporter_id: report.reporterId,
        reporter_name: report.reporterName,
        target_user_id: report.targetUserId,
        target_user_name: report.targetUserName,
        target_matric: report.targetMatric,
        target_photo: report.targetPhoto || null,
        reason: report.reason,
        details: report.details,
        status: report.status,
        created_at: new Date(report.createdAt).toISOString(),
      };

      const { error } = await supabase.from('user_reports').insert(row);
      if (error) {
        console.warn('Supabase report insert error:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Resolve Report (Admin)
  async resolveReport(reportId: string, status: 'resolved' | 'banned'): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('user_reports')
        .update({
          status,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) {
        console.warn('Supabase resolve report error:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Fetch gossip posts from Supabase
  async fetchGossipPosts(): Promise<GossipPost[] | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('gossip_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase gossip fetch notice:', error.message);
        return null;
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        authorId: row.author_id,
        authorName: row.author_name,
        authorAvatar: row.author_avatar || undefined,
        authorDepartment: row.author_department,
        authorLevel: row.author_level,
        isAnonymous: row.is_anonymous ?? true,
        anonymousAlias: row.anonymous_alias || undefined,
        tag: row.tag,
        content: row.content,
        imageUrl: row.image_url || undefined,
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        timeAgo: row.created_at ? new Date(row.created_at).toLocaleString() : 'Recently',
        spicyCount: row.spicy_count || 0,
        capCount: row.cap_count || 0,
        factsCount: row.facts_count || 0,
        teaCount: row.tea_count || 0,
        viewsCount: row.views_count || 0,
        comments: [],
      }));
    } catch (error) {
      console.warn('Supabase gossip fetch error:', error);
      return null;
    }
  },

  // Create Gossip Post
  async createGossipPost(post: GossipPost): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const row = {
        id: post.id,
        author_id: post.authorId,
        author_name: post.authorName,
        author_avatar: post.authorAvatar || '',
        author_department: post.authorDepartment,
        author_level: post.authorLevel,
        is_anonymous: post.isAnonymous,
        anonymous_alias: post.anonymousAlias || null,
        tag: post.tag,
        content: post.content,
        image_url: post.imageUrl || null,
        spicy_count: post.spicyCount || 0,
        cap_count: post.capCount || 0,
        facts_count: post.factsCount || 0,
        tea_count: post.teaCount || 0,
        views_count: post.viewsCount || 1,
        created_at: new Date(post.createdAt).toISOString(),
      };

      const { error } = await supabase.from('gossip_posts').insert(row);
      if (error) {
        console.warn('Supabase gossip insert error:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Delete Gossip Post
  async deleteGossipPost(postId: string): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('gossip_posts').delete().eq('id', postId);
      if (error) {
        console.warn('Supabase gossip delete error:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Fetch campus polls from Supabase
  async fetchCampusPolls(): Promise<CampusPoll[] | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('campus_polls')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase polls fetch notice:', error.message);
        return null;
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        question: row.question,
        category: row.category,
        options: Array.isArray(row.options) ? row.options : [],
        totalVotes: row.total_votes || 0,
        createdBy: row.created_by || undefined,
      }));
    } catch (error) {
      console.warn('Supabase polls fetch error:', error);
      return null;
    }
  },

  // Save or update a campus poll
  async upsertCampusPoll(poll: CampusPoll): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('campus_polls').upsert({
        id: poll.id,
        question: poll.question,
        category: poll.category,
        options: poll.options,
        total_votes: poll.totalVotes,
        created_by: poll.createdBy || null,
      });

      if (error) {
        console.warn('Supabase poll upsert notice:', error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Supabase poll upsert error:', error);
      return false;
    }
  },

  // Save a gossip comment
  async createGossipComment(
    postId: string,
    comment: GossipComment,
    authorId: string,
    authorDepartment: string
  ): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('gossip_comments').insert({
        id: comment.id,
        post_id: postId,
        author_id: authorId,
        author_name: comment.authorName,
        author_avatar: comment.authorAvatar || '',
        author_department: authorDepartment,
        is_anonymous: comment.isAnonymous,
        anonymous_alias: comment.isAnonymous ? comment.authorName : null,
        content: comment.content,
        created_at: new Date(comment.createdAt).toISOString(),
      });

      if (error) {
        console.warn('Supabase gossip comment notice:', error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Supabase gossip comment error:', error);
      return false;
    }
  },

  async voteCampusPoll(pollId: string, optionId: string): Promise<CampusPoll | null> {
    try {
      const { data, error } = await getSupabase().rpc('vote_campus_poll', {
        p_poll_id: pollId,
        p_option_id: optionId,
      });
      if (error || !data?.[0]) {
        console.warn('Supabase poll vote error:', error?.message || 'No vote result returned.');
        return null;
      }
      const result = data[0];
      return {
        id: pollId,
        question: '',
        category: '',
        options: Array.isArray(result.options) ? result.options : [],
        totalVotes: result.total_votes || 0,
        userVotedOptionId: result.user_voted_option_id || undefined,
      };
    } catch (error) {
      console.warn('Supabase poll vote exception:', error);
      return null;
    }
  },

  async reactToGossipPost(postId: string, reactionType: GossipPost['userReaction']): Promise<Pick<GossipPost, 'spicyCount' | 'capCount' | 'factsCount' | 'teaCount' | 'userReaction'> | null> {
    if (!reactionType) return null;
    try {
      const { data, error } = await getSupabase().rpc('react_to_gossip_post', {
        p_post_id: postId,
        p_reaction_type: reactionType,
      });
      if (error || !data?.[0]) {
        console.warn('Supabase gossip reaction error:', error?.message || 'No reaction result returned.');
        return null;
      }
      const result = data[0];
      return {
        spicyCount: result.spicy_count || 0,
        capCount: result.cap_count || 0,
        factsCount: result.facts_count || 0,
        teaCount: result.tea_count || 0,
        userReaction: result.user_reaction || undefined,
      };
    } catch (error) {
      console.warn('Supabase gossip reaction exception:', error);
      return null;
    }
  },

  async fetchUserChatHistory(userId: string): Promise<{
    matches: MatchItem[];
    messages: Record<string, ChatMessage[]>;
  } | null> {
    try {
      const supabase = getSupabase();
      const { data: matchRows, error: matchError } = await supabase
        .from('matches')
        .select('id, user_id_1, user_id_2, created_at, expires_at, last_message, last_message_time, is_lowkey_match')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (matchError) {
        console.warn('Supabase match history fetch notice:', matchError.message);
        return null;
      }

      const profiles = await supabaseService.fetchProfiles();
      const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
      const matches = (matchRows || []).flatMap((row: any) => {
        const matchedUserId = row.user_id_1 === userId ? row.user_id_2 : row.user_id_1;
        const matchedUser = profileMap.get(matchedUserId);
        if (!matchedUser) return [];

        return [{
          id: row.id,
          matchedUser,
          createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
          expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : Date.now(),
          lastMessage: row.last_message || undefined,
          lastMessageTime: row.last_message_time ? new Date(row.last_message_time).getTime() : undefined,
          hasUnread: false,
          isLowkeyMatch: Boolean(row.is_lowkey_match),
        } satisfies MatchItem];
      });

      const messages: Record<string, ChatMessage[]> = {};
      const matchIds = matches.map((match) => match.id);
      if (matchIds.length === 0) return { matches, messages };

      const { data: messageRows, error: messageError } = await supabase
        .from('messages')
        .select('id, match_id, sender_id, text, image_url, is_view_once, view_once_viewed, created_at, read')
        .in('match_id', matchIds)
        .order('created_at', { ascending: true });

      if (messageError) {
        console.warn('Supabase message history fetch notice:', messageError.message);
        return { matches, messages };
      }

      (messageRows || []).forEach((row: any) => {
        const message: ChatMessage = {
          id: row.id,
          matchId: row.match_id,
          senderId: row.sender_id,
          text: row.text || '',
          imageUrl: row.image_url || undefined,
          isPhotoViewOnce: Boolean(row.is_view_once),
          isPhotoViewed: Boolean(row.view_once_viewed),
          createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
          read: Boolean(row.read),
        };
        messages[message.matchId] = [...(messages[message.matchId] || []), message];
      });

      return { matches, messages };
    } catch (error) {
      console.warn('Supabase chat history fetch error:', error);
      return null;
    }
  },

  // Send Chat Message
  async sendMessage(message: ChatMessage): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const row = {
        id: message.id,
        match_id: message.matchId,
        sender_id: message.senderId,
        text: message.text,
        image_url: message.imageUrl || null,
        is_view_once: message.isPhotoViewOnce || false,
        view_once_viewed: message.isPhotoViewed || false,
        voice_note_url: null,
        voice_duration_seconds: null,
        created_at: new Date(message.createdAt).toISOString(),
        read: message.read || false,
      };

      const { error } = await supabase.from('messages').insert(row);
      if (error) {
        console.warn('Supabase message insert error:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },
};
