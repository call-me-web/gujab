import React, { useState, useRef, useEffect } from 'react';
import { Article, Page, User, Album } from '../types';
import { supabase } from '../services/supabaseClient';
import { ImageCropper } from './ImageCropper';

interface DashboardProps {
  onPublish: (article: Omit<Article, 'id' | 'liked_by' | 'user_id' | 'created_at'>) => Promise<void>;
  setPage: (page: Page) => void;
  currentUser: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ onPublish, setPage, currentUser }) => {
  const [formData, setFormData] = useState({
    headline: '',
    subhead: '',
    content: '',
    category: 'Gossip',
    image: '',
    tags: '',
    album_id: 'none'
  });

  // Album/Book Creation State
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumCover, setNewAlbumCover] = useState(''); // Stores URL string (either manual or uploaded)
  const [albumCoverFile, setAlbumCoverFile] = useState<Blob | null>(null); // Stores file blob

  // Image Upload & Crop State
  const [cropTarget, setCropTarget] = useState<'ARTICLE' | 'ALBUM'>('ARTICLE');
  const [imageFile, setImageFile] = useState<Blob | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const albumFileInputRef = useRef<HTMLInputElement>(null);

  const REDACTED_IMAGE = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20width%3D%22600%22%20height%3D%22400%22%20fill%3D%22%23e5e2d9%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%22580%22%20height%3D%22380%22%20fill%3D%22none%22%20stroke%3D%22%231a1a1a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M0%200L600%20400M600%200L0%20400%22%20stroke%3D%22%231a1a1a%22%20stroke-width%3D%221%22%20opacity%3D%220.1%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22monospace%22%20font-size%3D%2224%22%20fill%3D%22%231a1a1a%22%20font-weight%3D%22bold%22%3EIMAGE%20UNAVAILABLE%3C%2Ftext%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2260%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22monospace%22%20font-size%3D%2212%22%20fill%3D%22%23666%22%3E(Link%20Broken)%3C%2Ftext%3E%3C%2Fsvg%3E";

  useEffect(() => {
    fetchAlbums();
  }, [currentUser]);

  const fetchAlbums = async () => {
    const { data } = await supabase.from('albums').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    if (data) setAlbums(data as Album[]);
  };

  const uploadFileToSupabase = async (file: Blob): Promise<string | null> => {
    try {
      // Optimized: The ImageCropper now returns a WebP blob for better compression
      const fileExt = 'webp';
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, file, {
          contentType: 'image/webp',
          cacheControl: '31536000', // 1 year cache
          upsert: false
        });

      if (uploadError) {
        const err = uploadError as any;
        // Check if it's a missing bucket error
        if (err.statusCode == '404' || err.message === 'Bucket not found' || err.error === 'Bucket not found') {
          console.warn("Supabase Storage: Bucket 'article-images' missing.");
          alert("SYSTEM ERROR: Storage bucket missing. Check Admin Dashboard Diagnostics.");
          return null;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Upload Error:', error);
      alert(`Failed to upload image. Details: ${error?.message || 'Unknown error'}`);
      return null;
    }
  };

  const handlePreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError(false);

    if (!agreedToPolicy) {
      alert("You must agree to the Editorial Policy before printing.");
      return;
    }

    if (formData.headline.length > 60) {
      alert("Headline is too long. Please keep it minimal (under 60 characters).");
      return;
    }

    if (isCreatingAlbum && !newAlbumTitle.trim()) {
      alert("Please provide a title for your new Book/Album.");
      return;
    }

    setLoading(true);

    // Upload Article Image if present
    let finalArticleImageUrl = formData.image;
    if (imageFile) {
      const uploadedUrl = await uploadFileToSupabase(imageFile);
      if (!uploadedUrl) {
        setLoading(false);
        return;
      }
      finalArticleImageUrl = uploadedUrl;
    }

    setUploadedPreviewUrl(finalArticleImageUrl);
    setLoading(false);
    setShowConfirm(true);
  };

  const handleFinalPublish = async () => {
    setLoading(true);

    const authorName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Anonymous';
    const finalImageUrl = uploadedPreviewUrl || formData.image;

    let finalAlbumId = formData.album_id === 'none' ? undefined : formData.album_id;

    // Handle New Album Creation
    if (isCreatingAlbum && newAlbumTitle) {
      try {
        let finalAlbumCoverUrl = newAlbumCover;
        // Upload Album Cover if present
        if (albumCoverFile) {
          const uploadedCover = await uploadFileToSupabase(albumCoverFile);
          if (uploadedCover) finalAlbumCoverUrl = uploadedCover;
        }

        const { data: newAlbumData, error: albumError } = await supabase.from('albums').insert([{
          title: newAlbumTitle,
          cover_image: finalAlbumCoverUrl || undefined,
          user_id: currentUser.id
        }]).select();

        if (albumError) throw albumError;
        if (newAlbumData && newAlbumData[0]) {
          finalAlbumId = newAlbumData[0].id;
        }
      } catch (err: any) {
        console.error("Failed to create album", err);
        alert("Could not create book/album. Publishing as standalone.");
      }
    }

    const newArticleData = {
      headline: formData.headline,
      subhead: formData.subhead,
      author: authorName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      content: formData.content,
      image: finalImageUrl || undefined,
      category: formData.category as any,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      album_id: finalAlbumId
    };

    await onPublish(newArticleData);
    setLoading(false);
    setShowConfirm(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'ARTICLE' | 'ALBUM') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropSrc(reader.result as string);
        setCropTarget(target);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const onCropComplete = (croppedBlob: Blob) => {
    if (cropTarget === 'ARTICLE') {
      setImageFile(croppedBlob);
      setFormData({ ...formData, image: '' }); // Clear manual URL
    } else {
      setAlbumCoverFile(croppedBlob);
      setNewAlbumCover(''); // Clear manual URL
    }
    setIsCropping(false);
    setCropSrc(null);
  };

  const onCropCancel = () => {
    setIsCropping(false);
    setCropSrc(null);
    // Do not clear existing files, just cancel the new selection
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 relative">
      {/* CROPPER MODAL */}
      {isCropping && cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          onCropComplete={onCropComplete}
          onCancel={onCropCancel}
        />
      )}

      <div className="border-b-4 border-double border-black mb-8 pb-4 text-center">
        <h2 className="font-headline font-bold text-5xl mb-2">The Printing Press</h2>
        <p className="font-sans-condensed uppercase tracking-widest text-sm text-gray-600">
          "Hot Off The Press" • For Immediate Release
        </p>
      </div>

      <div className="bg-white p-8 border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
        <div className="absolute top-4 right-4 border-2 border-red-800 text-red-800 px-4 py-1 font-sans-condensed font-bold text-xl uppercase -rotate-12 opacity-80 pointer-events-none">
          CONFIDENTIAL
        </div>

        <form onSubmit={handlePreSubmit} className="space-y-8">

          {/* Main Content Group */}
          <div className="space-y-6">
            <div className="col-span-2">
              <div className="flex justify-between items-baseline mb-1">
                <label className="block font-sans-condensed font-bold uppercase text-xs">The Gujab (Headline)</label>
                <span className={`text-[10px] font-sans-condensed font-bold ${formData.headline.length >= 50 ? 'text-red-600' : 'text-gray-400'}`}>
                  {formData.headline.length}/60 MAX
                </span>
              </div>
              <input
                required
                name="headline"
                value={formData.headline}
                maxLength={60}
                onChange={handleChange}
                className="w-full bg-gray-50 border-b-2 border-black p-2 font-headline text-2xl focus:outline-none focus:bg-yellow-50 transition-colors placeholder-gray-300"
                placeholder="Keep it minimal (e.g. 'Mystery at the Harbor')"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-sans-condensed font-bold uppercase text-xs mb-1">The Gist (Subhead)</label>
              <input
                required
                name="subhead"
                value={formData.subhead}
                onChange={handleChange}
                className="w-full bg-gray-50 border-b border-gray-400 p-2 font-body italic text-lg focus:outline-none focus:border-black transition-colors"
                placeholder="Give us the juicy details in brief..."
              />
            </div>

            <div>
              <label className="block font-sans-condensed font-bold uppercase text-xs mb-1">Full Story</label>
              <textarea
                required
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="w-full h-64 bg-gray-50 border-2 border-gray-200 p-4 font-body text-lg leading-relaxed focus:outline-none focus:border-black resize-y"
                placeholder="Unfold the entire rumor here..."
              />
            </div>
          </div>

          <div className="border-t-2 border-black pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Categorization */}
            <div className="space-y-6">
              <div>
                <label className="block font-sans-condensed font-bold uppercase text-xs mb-1">Section</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-300 p-2 font-sans-condensed focus:outline-none focus:border-black"
                >
                  <option>Gossip</option>
                  <option>Tech</option>
                  <option>Celebrity</option>
                  <option>Politics</option>
                  <option>Finance</option>
                  <option>Creative Art</option>
                  <option>World</option>
                  <option>Lifestyle</option>
                  <option>Science</option>
                  <option>Sports</option>
                  <option>Satire</option>
                </select>
              </div>

              <div>
                <label className="block font-sans-condensed font-bold uppercase text-xs mb-1">Viral Hashtags (Custom Categories)</label>
                <input
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-300 p-2 font-secret text-sm focus:outline-none focus:border-black"
                  placeholder="e.g. #scandal, #deepfake, #weekend"
                />
                <p className="text-[9px] text-gray-500 mt-1 uppercase font-bold">Use hashtags to create viral custom categories.</p>
              </div>

              <div className="bg-[#f1efe9] p-4 border border-gray-300">
                <label className="block font-sans-condensed font-bold uppercase text-xs mb-2">Book / Album Portfolio</label>

                {!isCreatingAlbum ? (
                  <div className="space-y-2">
                    <select
                      name="album_id"
                      value={formData.album_id}
                      onChange={handleChange}
                      className="w-full bg-white border border-black p-2 font-sans-condensed text-sm"
                    >
                      <option value="none">-- Single Post (No Book) --</option>
                      {albums.map(a => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setIsCreatingAlbum(true); setFormData({ ...formData, album_id: 'none' }); }}
                      className="text-xs font-bold underline hover:text-red-800 uppercase"
                    >
                      + Create New Book/Album
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-red-800">New Portfolio Book</span>
                      <button type="button" onClick={() => setIsCreatingAlbum(false)} className="text-[10px] underline">Cancel</button>
                    </div>
                    <input
                      value={newAlbumTitle}
                      onChange={(e) => setNewAlbumTitle(e.target.value)}
                      placeholder="Book Title (e.g. 'Summer '25')"
                      className="w-full border border-black p-2 font-headline"
                    />

                    {/* Album Cover Upload */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={albumFileInputRef}
                          onChange={(e) => handleFileChange(e, 'ALBUM')}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => albumFileInputRef.current?.click()}
                          className="bg-gray-200 border border-gray-400 px-2 py-1 text-[10px] font-bold uppercase hover:bg-gray-300"
                        >
                          Upload Cover
                        </button>
                        <span className="text-[9px] text-gray-500 truncate max-w-[100px]">
                          {albumCoverFile ? 'File Selected' : 'Optional'}
                        </span>
                      </div>
                      {albumCoverFile && (
                        <div className="w-full h-24 bg-gray-200 relative overflow-hidden border border-black group">
                          <img src={URL.createObjectURL(albumCoverFile)} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">- OR -</span>
                        <input
                          value={newAlbumCover}
                          onChange={(e) => {
                            setNewAlbumCover(e.target.value);
                            setAlbumCoverFile(null);
                          }}
                          placeholder="Paste Cover URL..."
                          className="flex-grow border border-gray-300 p-1 text-[10px] font-secret"
                          disabled={!!albumCoverFile}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Image */}
            <div>
              <label className="block font-sans-condensed font-bold uppercase text-xs mb-1">Evidence (Image)</label>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e, 'ARTICLE')}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-black px-3 py-2 font-sans-condensed text-xs uppercase font-bold border border-black transition-colors"
                  >
                    {imageFile ? 'Change File' : 'Upload Photo'}
                  </button>
                  <span className="text-xs font-secret text-gray-500 truncate max-w-[150px]">
                    {imageFile ? 'Image Loaded (Ready to Print)' : 'No file selected'}
                  </span>
                </div>

                {imageFile && (
                  <div className="relative w-full h-40 bg-gray-100 border border-black overflow-hidden group">
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-sans-condensed font-bold uppercase">Ready</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans-condensed uppercase font-bold text-gray-400">- OR -</span>
                </div>

                <input
                  name="image"
                  value={formData.image}
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value });
                    setImageFile(null);
                  }}
                  disabled={!!imageFile}
                  className={`w-full bg-gray-50 border border-gray-300 p-2 font-secret text-sm focus:outline-none focus:border-black ${imageFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Paste external image link..."
                />
                {!imageFile && formData.image && !formData.image.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) && (
                  <p className="text-[10px] text-red-600 font-bold uppercase">
                    Warning: This link does not look like an image file (jpg/png).
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Policy Section */}
          <div className="mt-8 bg-[#f1efe9] border border-gray-400 p-4 relative">
            <div className="absolute -top-3 left-4 bg-white px-2 border border-gray-400 text-[10px] font-sans-condensed font-bold uppercase text-gray-500">
              Editorial Affidavit
            </div>
            <div className="flex flex-col gap-3">
              <p className="font-secret text-xs text-gray-700 leading-snug">
                <strong className="font-bold">By checking below, you agree to the Gujab Policy:</strong><br />
                1. Keep headlines minimal (max 60 chars) and creative.<br />
                2. No hate speech, targeted harassment, or explicit content.<br />
                3. Satire and rumors are welcome; malicious misinformation is not.<br />
                4. You acknowledge that content is for entertainment purposes.
              </p>
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div className={`w-5 h-5 flex-shrink-0 border-2 border-black flex items-center justify-center transition-colors ${agreedToPolicy ? 'bg-red-800 border-red-800' : 'bg-white group-hover:bg-gray-100'}`}>
                  {agreedToPolicy && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={agreedToPolicy}
                  onChange={(e) => setAgreedToPolicy(e.target.checked)}
                />
                <span className={`font-sans-condensed text-xs uppercase font-bold transition-colors ${agreedToPolicy ? 'text-red-900' : 'text-gray-500 group-hover:text-black'}`}>
                  I agree to the Gujab Editorial Policy.
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center border-t-2 border-black mt-8">
            <p className="font-secret text-sm">Posting as: <span className="font-bold">{currentUser.user_metadata?.full_name || currentUser.email}</span></p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPage(Page.HOME)}
                className="font-sans-condensed uppercase text-xs font-bold hover:underline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-red-800 text-white px-8 py-3 font-sans-condensed font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg"
              >
                {loading ? 'Processing...' : 'Preview'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#f1efe9] max-w-lg w-full p-8 border-4 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] transform rotate-1 overflow-y-auto max-h-[90vh]">
            <div className="border-b-2 border-black pb-4 mb-4 text-center">
              <h3 className="font-masthead text-4xl">Final Proof</h3>
              <p className="font-sans-condensed uppercase text-xs tracking-widest font-bold">Print Order #{(Math.random() * 10000).toFixed(0)}</p>
            </div>

            <div className="space-y-4 mb-8 font-body">
              <p className="text-center italic text-lg">"Are you sure this story is ready for the press?"</p>
              <div className="bg-white border border-gray-300 p-4 font-secret text-sm">
                <p><span className="font-bold">HEADLINE:</span> {formData.headline}</p>
                <p className="mt-2"><span className="font-bold">AUTHOR:</span> {currentUser.user_metadata?.full_name || currentUser.email}</p>
                {isCreatingAlbum && (
                  <div className="mt-2 text-red-800 border-t border-red-200 pt-2">
                    <p><span className="font-bold">NEW BOOK:</span> {newAlbumTitle}</p>
                    {albumCoverFile && <p className="text-[10px] italic">(Cover image attached)</p>}
                  </div>
                )}
                {formData.album_id !== 'none' && !isCreatingAlbum && (
                  <p className="mt-2 text-red-800"><span className="font-bold">BOOK ID:</span> {formData.album_id}</p>
                )}

                {formData.tags && (
                  <p className="mt-2 text-blue-800"><span className="font-bold">HASHTAGS:</span> {formData.tags}</p>
                )}

                {uploadedPreviewUrl && (
                  <div className="mt-4 border-2 border-dashed border-gray-400 p-2">
                    <p className="font-bold text-xs uppercase mb-1 text-gray-500">Image Preview</p>
                    <img
                      src={imageError ? REDACTED_IMAGE : uploadedPreviewUrl}
                      alt="Preview"
                      onError={() => setImageError(true)}
                      className="w-full h-auto max-h-48 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border-2 border-black py-3 font-sans-condensed font-bold uppercase hover:bg-gray-200 transition-colors"
              >
                Retract
              </button>
              <button
                onClick={handleFinalPublish}
                disabled={loading}
                className="flex-1 bg-black text-white border-2 border-black py-3 font-sans-condensed font-bold uppercase hover:bg-red-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Printing...' : 'Issue Print Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};