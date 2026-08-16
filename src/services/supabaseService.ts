import { getSupabase } from '../lib/supabase';
import {
  UserProfile,
  VerificationRequest,
  UserReport,
  GossipPost,
  CampusPoll,
  ChatMessage,
  MatchItem,
} from '../types';

/**
 * Service for syncing UniAbuja MeetUps data with Supabase PostgreSQL
 */
export const supabaseService = {
  // Test connection to Supabase
  async checkConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      if (error) {
        // Table might not exist yet if schema hasn't been run
        return {
          connected: true,
          message: `Connected to Supabase (Database active, note: ${error.message})`,
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
        portalSynced: r.portal_synced ?? false,
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

  // Create Gossip Post
  async createGossipPost(post: GossipPost): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const row = {
        id: post.id,
        author_id: post.authorId,
        author_name: post.authorName,
        author_avatar: post.authorAvatar,
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
