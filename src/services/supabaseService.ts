import { getSupabase } from '../lib/supabase';
import {
  UserProfile,
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
  async uploadUserMedia(file: File, userId: string, folder: 'profiles' | 'gossip' | 'verification') {
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

  // Seed / Sync initial profiles
  async seedProfilesIfEmpty(initialProfiles: UserProfile[]): Promise<UserProfile[] | null> {
    try {
      const supabase = getSupabase();
      const { data: existing, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.warn('Supabase profiles query notice:', error.message);
        return null;
      }

      if (!existing || existing.length === 0) {
        // Seed initial profiles
        const rows = initialProfiles.map((p) => ({
          id: p.id,
          name: p.name,
          age: p.age,
          matric_number: p.matricNumber,
          faculty: p.faculty,
          department: p.department,
          level: p.level,
          campus_location: p.campusLocation,
          bio: p.bio,
          photos: p.photos,
          interests: p.interests,
          looking_for: p.lookingFor,
          mode: p.mode,
          is_verified: p.isVerified,
          verification_status: p.verificationStatus,
          badges: p.badges,
          is_banned: p.isBanned,
          instagram: p.instagramHandle || null,
          snapchat: p.snapchatHandle || null,
          phone_whatsapp: null,
        }));

        const { error: insertError } = await supabase.from('profiles').insert(rows);
        if (insertError) {
          console.warn('Supabase profiles seeding notice:', insertError.message);
        }
        return initialProfiles;
      }

      // Map rows back to UserProfile format
      return existing.map((r: any) => ({
        id: r.id,
        name: r.name,
        age: r.age,
        matricNumber: r.matric_number,
        gender: r.gender || 'Prefer not to say',
        faculty: r.faculty,
        course: r.course || r.department || 'Student',
        department: r.department,
        level: r.level,
        campusLocation: r.campus_location,
        bio: r.bio,
        photos: r.photos || [],
        interests: r.interests || [],
        lookingFor: r.looking_for,
        mode: r.mode || 'normal',
        isVerified: r.is_verified,
        verificationStatus: r.verification_status || 'unverified',
        icebreakerPrompts: Array.isArray(r.icebreaker_prompts) ? r.icebreaker_prompts : [],
        badges: r.badges || [],
        isBanned: r.is_banned || false,
        lastActive: r.last_active || 'Recently active',
        isOnline: r.is_online ?? false,
        instagramHandle: r.instagram || undefined,
        snapchatHandle: r.snapchat || undefined,
      }));
    } catch (e) {
      console.warn('Supabase fetch error:', e);
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
