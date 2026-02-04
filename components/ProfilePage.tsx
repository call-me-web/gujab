import React, { useEffect, useState, useRef } from 'react';
import { Page, User, UserProfile, Article, Album } from '../types';
import { supabase } from '../services/supabaseClient';
import { ArticleGrid } from './ArticleGrid';
import { ImageCropper } from './ImageCropper';

interface ProfilePageProps {
  userId: string;
  currentUser: User | null;
  setPage: (page: Page) => void;
  onLike: (id: string) => void;
  onViewArticle: (id: string) => void;
  viewerId: string;
  onViewProfile: (userId: string) => void;
  onViewBook: (bookId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userId, currentUser, setPage, onLike, onViewArticle, viewerId, onViewProfile, onViewBook }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // Edit State
  const [editForm, setEditForm] = useState({
      full_name: '',
      bio: '',
      website: '',
      avatar_url: ''
  });
  const [saving, setSaving] = useState(false);

  // Avatar Upload State
  const [isCropping, setIsCropping] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [newAvatarBlob, setNewAvatarBlob] = useState<Blob | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    // SECURITY: Immediate state clear on ID change
    setProfile(null);
    setArticles([]);
    setAlbums([]);
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    if (!userId) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
        // Fetch Profile
        let { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        
        // SELF-HEALING: If profile is missing but it is the current logged-in user, force create it.
        // Used upsert to prevent race conditions if trigger ran simultaneously.
        if (!profileData && isOwnProfile && currentUser) {
            console.warn('Profile missing for authenticated user. Attempting self-repair...');
            const { data: newProfile, error: createError } = await supabase.from('profiles').upsert([{
                id: currentUser.id,
                full_name: currentUser.user_metadata?.full_name || 'New Agent',
                avatar_url: currentUser.user_metadata?.avatar_url || '',
                updated_at: new Date()
            }]).select().single();
            
            if (newProfile) {
                profileData = newProfile;
            } else if (createError) {
                console.error('Self-repair failed', createError);
                // Last ditch: if table doesn't exist or RLS blocked, we mock it client side so user isn't stuck
                profileData = {
                    id: currentUser.id,
                    full_name: currentUser.user_metadata?.full_name || 'Agent (Offline)',
                    avatar_url: currentUser.user_metadata?.avatar_url || '',
                    bio: 'Database Connection Offline. Profile strictly local.'
                };
            }
        }
        
        if (profileData) {
            setProfile(profileData as UserProfile);
            setEditForm({
                full_name: profileData.full_name || '',
                bio: profileData.bio || '',
                website: profileData.website || '',
                avatar_url: profileData.avatar_url || ''
            });
            setPreviewAvatarUrl(profileData.avatar_url || null);
        }

        // Fetch Articles
        const { data: articlesData } = await supabase.from('articles').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (articlesData) setArticles(articlesData as Article[]);

        // Fetch Albums
        const { data: albumsData } = await supabase.from('albums').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (albumsData) setAlbums(albumsData as Album[]);

    } catch (err) {
        console.error("Profile Fetch Error", err);
    } finally {
        setLoading(false);
    }
  };

  const handleLocalLike = (id: string) => {
    // 1. Call parent to execute DB toggle and global state update
    onLike(id);
    
    // 2. Optimistically update local state so the UI reflects the change immediately
    setArticles(prevArticles => prevArticles.map(article => {
        if (article.id !== id) return article;
        
        const likes = article.liked_by || [];
        const isLiked = likes.includes(viewerId);
        
        // Toggle viewerId in the liked_by array
        const newLikes = isLiked 
            ? likes.filter(uid => uid !== viewerId) 
            : [...likes, viewerId];
            
        return { ...article, liked_by: newLikes };
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.addEventListener('load', () => {
              setCropSrc(reader.result as string);
              setIsCropping(true);
          });
          reader.readAsDataURL(file);
      }
      // Reset input
      e.target.value = '';
  };

  const onCropComplete = (croppedBlob: Blob) => {
      setNewAvatarBlob(croppedBlob);
      setPreviewAvatarUrl(URL.createObjectURL(croppedBlob));
      setIsCropping(false);
      setCropSrc(null);
  };

  const uploadAvatarToSupabase = async (file: Blob): Promise<string | null> => {
      try {
          const fileName = `avatar_${userId}_${Date.now()}.webp`;
          const { error: uploadError } = await supabase.storage
              .from('article-images') // Reusing existing bucket
              .upload(fileName, file, {
                  contentType: 'image/webp',
                  cacheControl: '3600',
                  upsert: true
              });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
              .from('article-images')
              .getPublicUrl(fileName);
          
          return publicUrl;
      } catch (error: any) {
          console.error('Avatar Upload Error:', error);
          alert('Failed to upload mugshot. keeping old one.');
          return null;
      }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
          let finalAvatarUrl = editForm.avatar_url;

          // If a new image was selected/cropped, upload it first
          if (newAvatarBlob) {
              const uploadedUrl = await uploadAvatarToSupabase(newAvatarBlob);
              if (uploadedUrl) {
                  finalAvatarUrl = uploadedUrl;
              }
          }

          const updates = {
              id: userId,
              ...editForm,
              avatar_url: finalAvatarUrl,
              updated_at: new Date(),
          };

          const { error } = await supabase.from('profiles').upsert(updates);
          if (error) throw error;
          
          setProfile({ ...profile, ...updates } as UserProfile);
          setEditForm(prev => ({ ...prev, avatar_url: finalAvatarUrl }));
          setNewAvatarBlob(null); // Clear pending blob
          setEditing(false);
      } catch (error: any) {
          alert('Error updating profile: ' + error.message);
      } finally {
          setSaving(false);
      }
  };

  const handleBookClick = (bookId: string) => {
      // Use state navigation instead of direct history manipulation to avoid SecurityError in blob environments
      onViewBook(bookId);
  };

  if (loading) {
      return <div className="py-32 text-center font-secret animate-pulse">Accessing Personnel Files...</div>;
  }

  // Fallback if no profile data found
  if (!profile && !loading) {
       return (
           <div className="py-20 text-center">
               <h2 className="font-headline font-bold text-4xl">Unknown Agent</h2>
               <div className="mt-4 font-secret text-sm text-gray-500">
                  <p>Profile ID: {userId.substring(0,8)}...</p>
                  <p>Status: No Record Found</p>
               </div>
               <button onClick={() => setPage(Page.HOME)} className="mt-6 underline font-bold uppercase">Return to Base</button>
           </div>
       );
  }

  // Filter out articles that belong to albums for the main grid
  const standaloneArticles = articles.filter(a => !a.album_id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in duration-700 relative">
      {/* Cropper Modal */}
      {isCropping && cropSrc && (
          <ImageCropper 
             imageSrc={cropSrc} 
             onCropComplete={onCropComplete} 
             onCancel={() => { setIsCropping(false); setCropSrc(null); }} 
          />
      )}

      <div className="mb-8">
        <button onClick={() => setPage(Page.HOME)} className="font-sans-condensed uppercase text-xs font-bold hover:underline">
          &larr; Back to Front Page
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* PROFILE SIDEBAR / HEADER */}
          <div className="lg:col-span-4">
              <div className="bg-[#f1efe9] border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] sticky top-24">
                  
                  <div className="border-b-4 border-black pb-4 mb-6 text-center">
                       <div className="w-40 h-40 mx-auto bg-gray-300 border-4 border-black mb-4 overflow-hidden relative group">
                           {/* Avatar Display Logic */}
                           {editing && previewAvatarUrl ? (
                               <img src={previewAvatarUrl} alt="Preview" className="w-full h-full object-cover grayscale contrast-125" />
                           ) : profile?.avatar_url ? (
                               <img src={profile.avatar_url} alt="Agent" className="w-full h-full object-cover grayscale contrast-125" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 font-masthead text-6xl">?</div>
                           )}
                           
                           {/* Overlay only visible when NOT editing to show vibe */}
                           {!editing && <div className="absolute inset-0 bg-paper/20 pointer-events-none mix-blend-multiply"></div>}
                       </div>
                       
                       {!editing && (
                           <>
                               <h1 className="font-headline font-bold text-3xl uppercase leading-none mb-1">
                                   {profile?.full_name || 'Anonymous'}
                               </h1>
                               <p className="font-sans-condensed text-xs font-bold uppercase tracking-widest text-red-800">
                                   Gujab Contributor
                               </p>
                           </>
                       )}
                  </div>

                  {editing ? (
                      <form onSubmit={handleSaveProfile} className="space-y-4">
                          
                          {/* Image Upload Control */}
                          <div className="border-2 border-black border-dashed p-2 text-center bg-gray-100">
                              <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  onChange={handleFileSelect} 
                                  accept="image/*" 
                                  className="hidden" 
                              />
                              <button 
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-[10px] uppercase font-bold text-black underline hover:text-red-800"
                              >
                                  {newAvatarBlob ? 'Change Photo' : 'Upload Mugshot'}
                              </button>
                              <div className="text-[9px] text-gray-500 mt-1 font-secret">
                                  {newAvatarBlob ? 'New file selected' : 'Current photo loaded'}
                              </div>
                          </div>

                          <div>
                              <label className="block text-[10px] uppercase font-bold mb-1">Codename (Name)</label>
                              <input 
                                className="w-full border-2 border-black p-2 font-secret text-sm" 
                                value={editForm.full_name}
                                onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                                placeholder="Enter public alias..."
                              />
                          </div>
                          
                          <div>
                              <label className="block text-[10px] uppercase font-bold mb-1">Dossier (Bio)</label>
                              <textarea 
                                className="w-full border-2 border-black p-2 font-secret text-sm h-32" 
                                value={editForm.bio}
                                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                                placeholder="Brief background story..."
                              />
                          </div>
                          
                          {/* Optional Website Field */}
                          <div>
                              <label className="block text-[10px] uppercase font-bold mb-1">Comms Link (Website)</label>
                              <input 
                                className="w-full border-2 border-black p-2 font-secret text-sm" 
                                value={editForm.website}
                                onChange={e => setEditForm({...editForm, website: e.target.value})}
                                placeholder="https://..."
                              />
                          </div>

                          <div className="flex gap-2 pt-2">
                              <button 
                                type="button" 
                                onClick={() => {
                                    setEditing(false);
                                    setNewAvatarBlob(null);
                                    setPreviewAvatarUrl(profile?.avatar_url || null);
                                }} 
                                className="flex-1 border-2 border-black py-2 font-bold text-xs uppercase hover:bg-gray-200"
                              >
                                  Cancel
                              </button>
                              <button 
                                type="submit" 
                                disabled={saving} 
                                className="flex-1 bg-black text-white border-2 border-black py-2 font-bold text-xs uppercase hover:bg-red-800 disabled:opacity-50"
                              >
                                  {saving ? 'Updating...' : 'Save Record'}
                              </button>
                          </div>
                      </form>
                  ) : (
                      <div className="font-secret text-sm text-gray-800 space-y-4">
                          <p className="leading-relaxed italic">
                              "{profile?.bio || 'No background information available. Subject is elusive.'}"
                          </p>
                          
                          {profile?.website && (
                              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="block text-xs text-center border-b border-gray-300 pb-2 hover:text-red-800 truncate">
                                  {profile.website}
                              </a>
                          )}

                          <div className="pt-4 border-t-2 border-black grid grid-cols-2 gap-4 text-center">
                              <div>
                                  <span className="block font-headline font-bold text-3xl">{articles.length}</span>
                                  <span className="block text-[9px] uppercase font-bold text-gray-500">Dispatches</span>
                              </div>
                              <div>
                                  <span className="block font-headline font-bold text-3xl">{albums.length}</span>
                                  <span className="block text-[9px] uppercase font-bold text-gray-500">Portfolios</span>
                              </div>
                          </div>

                          {isOwnProfile && (
                              <button 
                                onClick={() => setEditing(true)}
                                className="w-full mt-4 bg-white border-2 border-black py-2 font-sans-condensed font-bold uppercase text-xs hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none"
                              >
                                  Edit Personnel File
                              </button>
                          )}
                      </div>
                  )}

              </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-8 space-y-12">
              
              {/* ALBUMS / BOOKS SECTION */}
              {albums.length > 0 && (
                  <section>
                      <div className="flex items-center gap-4 mb-6">
                          <h2 className="font-headline font-bold text-3xl uppercase italic">Published Books</h2>
                          <div className="h-[2px] bg-black flex-grow"></div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                          {albums.map(album => (
                              <div 
                                key={album.id} 
                                onClick={() => handleBookClick(album.id)}
                                className="group cursor-pointer relative w-full aspect-[2/3] perspective-1000 transform-gpu hover:z-10"
                              >
                                  {/* BOOK 3D CONTAINER */}
                                  <div className="absolute inset-0 bg-[#1a1a1a] text-white shadow-[8px_8px_15px_rgba(0,0,0,0.4)] transform transition-transform duration-300 group-hover:-translate-y-2 group-hover:-rotate-1 group-hover:shadow-[15px_15px_25px_rgba(0,0,0,0.5)] border-r-[4px] border-b-[4px] border-gray-900 rounded-r-sm overflow-hidden">
                                       
                                       {/* SPINE (Left Edge) */}
                                       <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-800 via-gray-700 to-black z-20 border-r border-gray-600 shadow-xl"></div>
                                       
                                       {/* COVER IMAGE - COLORFUL & AESTHETIC */}
                                       {album.cover_image ? (
                                           <div 
                                              className="absolute inset-0 left-6 transition-all duration-500 ease-out bg-cover bg-center brightness-90 contrast-125 saturate-[0.85] group-hover:saturate-100 group-hover:brightness-100 group-hover:scale-105" 
                                              style={{ backgroundImage: `url(${album.cover_image})` }}
                                           >
                                              {/* Gradient overlay to ensure text pops but image remains colorful */}
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 opacity-80 mix-blend-multiply"></div>
                                           </div>
                                       ) : (
                                           <div className="absolute inset-0 left-6 bg-[#2a2a2a]"></div>
                                       )}
                                       
                                       {/* BOOK TITLE & CONTENT */}
                                       <div className="absolute inset-0 left-6 p-4 flex flex-col justify-between z-30">
                                           <div className="mt-4 border-b border-white/40 pb-2">
                                               <h3 className="font-headline font-bold text-3xl leading-none text-white drop-shadow-md text-balance">{album.title}</h3>
                                           </div>
                                           <div className="mb-2">
                                              <span className="font-sans-condensed font-bold uppercase text-[10px] tracking-widest bg-red-800 text-white px-2 py-1 shadow-sm inline-block">
                                                  Collection
                                              </span>
                                           </div>
                                       </div>
                                       
                                       {/* TEXTURE OVERLAY */}
                                       <div 
                                          className="absolute inset-0 left-6 pointer-events-none opacity-30 mix-blend-overlay"
                                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
                                       ></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

              {/* LATEST STANDALONE ARTICLES */}
              <section>
                  <div className="flex items-center gap-4 mb-6">
                      <h2 className="font-headline font-bold text-3xl uppercase italic">Loose Dispatches</h2>
                      <div className="h-[2px] bg-black flex-grow"></div>
                  </div>
                  
                  {standaloneArticles.length > 0 ? (
                      <ArticleGrid 
                        articles={standaloneArticles} 
                        onLike={handleLocalLike} 
                        currentUser={currentUser} 
                        onViewArticle={onViewArticle} 
                        viewerId={viewerId} 
                        onViewProfile={onViewProfile} 
                      />
                  ) : (
                      <div className="p-12 border-2 border-dashed border-gray-400 text-center">
                          <p className="font-secret text-gray-500">
                             {articles.length > 0 
                               ? "All dispatches have been filed into portfolios."
                               : "This agent has not filed any reports yet."}
                          </p>
                      </div>
                  )}
              </section>

          </div>
      </div>
    </div>
  );
};