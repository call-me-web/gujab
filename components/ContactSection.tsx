import React, { useState, useRef } from 'react';
import { Page, User } from '../types';
import { supabase } from '../services/supabaseClient';

interface ContactSectionProps {
  setPage: (page: Page) => void;
  currentUser: User | null;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ setPage, currentUser }) => {
  const [formData, setFormData] = useState({
    alias: '',
    subject: '',
    tip: ''
  });
  const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SENT' | 'ERROR'>('IDLE');
  const [file, setFile] = useState<File | Blob | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_TIP_LENGTH = 3000;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Helper to compress image to WebP (Same logic as ImageCropper)
  const compressImage = async (file: File): Promise<Blob | null> => {
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_DIMENSION = 1920; // HD Standard limit
                  let width = img.width;
                  let height = img.height;

                  // Resize logic
                  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                      if (width > height) {
                          height *= MAX_DIMENSION / width;
                          width = MAX_DIMENSION;
                      } else {
                          width *= MAX_DIMENSION / height;
                          height = MAX_DIMENSION;
                      }
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) {
                      resolve(null);
                      return;
                  }
                  
                  ctx.drawImage(img, 0, 0, width, height);
                  
                  // Convert to WebP with 0.8 quality
                  canvas.toBlob((blob) => {
                      resolve(blob);
                  }, 'image/webp', 0.8);
              };
              img.onerror = () => resolve(null);
          };
          reader.onerror = () => resolve(null);
      });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const selectedFile = e.target.files[0];
          setFileName(selectedFile.name);
          setIsCompressing(true);
          
          // Check if it's an image before compressing
          if (selectedFile.type.startsWith('image/')) {
              const compressedBlob = await compressImage(selectedFile);
              if (compressedBlob) {
                  setFile(compressedBlob);
              } else {
                  // Fallback to original if compression fails
                  setFile(selectedFile);
              }
          } else {
              setFile(selectedFile);
          }
          setIsCompressing(false);
      }
  };

  const uploadEvidence = async (fileToUpload: File | Blob): Promise<string | null> => {
      try {
          // Force .webp extension if we compressed it, otherwise use original or fallback
          const fileExt = fileToUpload.type === 'image/webp' ? 'webp' : 'jpg'; 
          const finalName = `evidence_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
              .from('article-images')
              .upload(finalName, fileToUpload, {
                  contentType: fileToUpload.type || 'image/jpeg',
                  upsert: false
              });
          
          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('article-images').getPublicUrl(finalName);
          return data.publicUrl;
      } catch (err) {
          console.error("Evidence Upload Failed", err);
          return null;
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tip.trim()) return;

    setStatus('SENDING');
    
    const userEmail = currentUser?.email || null;
    const userName = currentUser?.user_metadata?.full_name || null;
    const aliasToUse = formData.alias || (currentUser ? 'Verified Source' : 'Anonymous Source');

    let finalTipContent = formData.tip;
    
    if (userEmail || userName) {
        finalTipContent += `\n\n--- [Private Sender Info] ---\nName: ${userName || 'N/A'}\nEmail: ${userEmail || 'N/A'}`;
    }

    try {
      let imageUrl = null;
      if (file) {
          imageUrl = await uploadEvidence(file);
          if (!imageUrl) {
              finalTipContent += `\n\n[System Note: Image upload failed during transmission]`;
          }
      }

      // Use direct INSERT to support image_url without needing a specific RPC overload
      const { error } = await supabase.from('tips').insert([{
          alias: aliasToUse,
          subject: formData.subject,
          tip: finalTipContent,
          image_url: imageUrl
      }]);

      if (error) throw error;

      setTimeout(() => {
        setStatus('SENT');
        setFormData({ alias: '', subject: '', tip: '' });
        setFile(null);
        setFileName('');
      }, 800);

    } catch (error: any) {
      console.error('Error sending tip:', error);
      setStatus('ERROR');
      alert(`The telegraph line was cut. (${error.message || 'Transmission Error'})`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      <div className="mb-8">
        <button onClick={() => setPage(Page.HOME)} className="font-sans-condensed uppercase text-xs font-bold hover:underline">
          &larr; Return to Front Page
        </button>
      </div>

      <div className="text-center mb-16 border-b-4 border-black pb-8 relative">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 font-sans-condensed font-bold uppercase text-[10px] tracking-widest">
            Confidential Correspondence
        </div>
        <h2 className="font-headline text-6xl font-bold mb-4 tracking-tighter">The Dispatch Desk</h2>
        <p className="font-secret text-2xl italic text-gray-600">
          "Whisper into the void. We'll capture it in ink."
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Form Area */}
        <div className="lg:col-span-8">
            <div className="bg-white border-4 border-black p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-800/5 -rotate-45 translate-x-16 -translate-y-16 pointer-events-none"></div>
                
                {status === 'SENT' ? (
                    <div className="py-20 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                        <div className="border-[8px] border-double border-red-800 p-6 -rotate-6 mb-8">
                            <h3 className="font-sans-condensed font-black text-5xl text-red-800 uppercase tracking-widest leading-none">TRANSMITTED</h3>
                        </div>
                        <p className="font-secret text-center text-xl text-gray-600 mb-10 max-w-sm">
                            "Your dispatch has been successfully logged. Discretion is absolute."
                        </p>
                        <button 
                            onClick={() => setStatus('IDLE')}
                            className="bg-black text-white px-8 py-3 font-sans-condensed font-bold uppercase hover:bg-red-800 transition-colors"
                        >
                            Draft New Telegram
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-black text-white flex items-center justify-center text-2xl">✉</div>
                            <h3 className="font-sans-condensed font-bold text-2xl uppercase tracking-widest border-b-2 border-black flex-grow">Secure Telegram</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block font-sans-condensed text-xs font-bold uppercase mb-2 tracking-widest text-gray-500">Sender's Alias</label>
                                <input 
                                    type="text" 
                                    name="alias"
                                    value={formData.alias}
                                    onChange={handleChange}
                                    className="w-full bg-transparent border-b-2 border-black p-2 font-secret text-lg focus:bg-yellow-50 focus:outline-none transition-all"
                                    placeholder={currentUser ? "Verified Insider" : "Anonymous Ghost"}
                                />
                            </div>
                            <div>
                                <label className="block font-sans-condensed text-xs font-bold uppercase mb-2 tracking-widest text-gray-500">Subject Wire</label>
                                <input 
                                    type="text" 
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-transparent border-b-2 border-black p-2 font-secret text-lg focus:bg-yellow-50 focus:outline-none transition-all"
                                    placeholder="RE: TOP SECRET"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block font-sans-condensed text-xs font-bold uppercase tracking-widest text-gray-500">The Secret</label>
                                <span className="font-secret text-[10px] text-gray-400">{formData.tip.length}/{MAX_TIP_LENGTH} CHARS</span>
                            </div>
                            <textarea 
                                name="tip"
                                value={formData.tip}
                                onChange={handleChange}
                                required
                                maxLength={MAX_TIP_LENGTH}
                                className="w-full bg-gray-50 border-2 border-black p-6 h-64 font-body text-xl focus:bg-white focus:outline-none focus:border-red-800 transition-all resize-none"
                                placeholder="Unfold the rumor here..."
                            ></textarea>
                        </div>
                        
                        {/* Evidence Upload */}
                        <div className="bg-gray-50 p-4 border border-gray-300">
                             <div className="flex justify-between items-center mb-2">
                                <label className="font-sans-condensed text-xs font-bold uppercase tracking-widest text-gray-500">
                                    Visual Artifacts (Optional)
                                </label>
                                {file && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setFile(null); setFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                        className="text-[10px] text-red-600 font-bold uppercase underline"
                                    >
                                        Remove Attachment
                                    </button>
                                )}
                             </div>
                             
                             <div className="flex items-center gap-4">
                                 <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                 />
                                 <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`px-4 py-2 font-sans-condensed text-xs uppercase font-bold border-2 border-black transition-colors ${file ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'}`}
                                 >
                                     {file ? (isCompressing ? 'Compressing...' : 'Artifact Attached') : 'Attach Evidence'}
                                 </button>
                                 <span className="font-secret text-xs text-gray-500 truncate max-w-[200px]">
                                     {file ? fileName : 'No file selected'}
                                 </span>
                             </div>
                             {file && !isCompressing && (
                                 <div className="mt-2 text-[10px] text-green-700 font-bold uppercase flex items-center gap-1">
                                     <span>✓</span> Ready for encryption (Compressed)
                                 </div>
                             )}
                        </div>

                        <button 
                            type="submit"
                            disabled={status === 'SENDING' || isCompressing}
                            className="w-full group bg-black text-white py-5 font-sans-condensed font-black text-2xl uppercase tracking-[0.3em] hover:bg-red-800 transition-all shadow-[10px_10px_0px_0px_rgba(153,27,27,0.4)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 disabled:opacity-50"
                        >
                            {status === 'SENDING' ? 'Encrypting & Sending...' : 'Dispatch Telegram'}
                        </button>
                    </form>
                )}
            </div>
        </div>

        {/* Sidebar Info Area */}
        <div className="lg:col-span-4 space-y-8">
            <div className="border-4 border-black p-8 bg-[#fcfbf9] relative">
                <div className="absolute top-0 right-0 w-12 h-12 bg-black flex items-center justify-center text-white font-bold">!</div>
                <h4 className="font-sans-condensed font-bold text-xl uppercase mb-6 border-b-2 border-black pb-2">Dead Drop Rules</h4>
                <ul className="space-y-6 font-secret text-sm leading-relaxed">
                    <li className="flex gap-3">
                        <span className="font-bold text-red-800">01.</span>
                        <span>Discretion is paramount. Your IP and metadata are scrubbed from the final print.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-bold text-red-800">02.</span>
                        <span>Credibility matters. Rumors with evidence (visual artifacts) are prioritized.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-bold text-red-800">03.</span>
                        <span>The Editor reserves the right to redact or expand any dispatch.</span>
                    </li>
                </ul>
            </div>

            <div className="bg-black text-white p-8 border-4 border-gray-600">
                <h4 className="font-sans-condensed font-bold text-xs uppercase mb-4 tracking-[0.2em] text-gray-400">Direct Wires</h4>
                <div className="space-y-4 font-secret text-sm">
                    <div>
                        <p className="font-bold uppercase text-[10px] text-red-500 mb-1">Encrypted Email</p>
                        <p>gujab.archives@protonmail.com</p>
                    </div>
                    <div>
                        <p className="font-bold uppercase text-[10px] text-red-500 mb-1">Secure Telegram</p>
                        <p>@GujabOfficial_Wire</p>
                    </div>
                </div>
            </div>

            <div className="p-6 border-2 border-dashed border-black text-center opacity-60">
                <p className="font-secret text-xs italic">
                    "Searching for the truth in a world of beautifully crafted lies."
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};