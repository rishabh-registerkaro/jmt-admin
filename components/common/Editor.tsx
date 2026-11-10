// second approach (working with the image and upload and links)
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import {Table} from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon,
  List, ListOrdered, Quote, Code2, Minus,
  Link2, Image as ImageIcon, Table as TableIcon,
  Undo, Redo, Heading1, Heading2, Heading3, Upload, X, Loader2, ExternalLink, Trash2
} from 'lucide-react';
import { uploadFileToMedia, uploadMediaAsset } from '@/app/lib/utils/media';


const lowlight = createLowlight();

interface EditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

const Tiptap = ({ content = '', onChange, placeholder = 'Start writing...' }: EditorProps) => {
  const [updated, setUpdated] = useState(0);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({ 
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Underline,
      Image.configure({ inline: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-invert max-w-none focus:outline-none p-4',
        placeholder: placeholder,
      },
      // Pasting a bare image URL inserts the image itself instead of a link
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain')?.trim();
        if (text && /^https?:\/\/\S+\.(png|jpe?g|gif|webp|avif|svg)(\?\S*)?$/i.test(text)) {
          const { schema } = view.state;
          const node = schema.nodes.image?.createAndFill({ src: text });
          if (node) {
            view.dispatch(view.state.tr.replaceSelectionWith(node).scrollIntoView());
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      setUpdated((prev: number) => prev + 1);
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    onSelectionUpdate: () => setUpdated((prev: number) => prev + 1),
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Focus link input when modal opens
  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      setTimeout(() => {
        linkInputRef.current?.focus();
      }, 100);
    }
  }, [showLinkInput]);

  const setLink = useCallback(() => {
    if (!editor) return;

    // Check if link is already active
    if (editor.isActive('link')) {
      const attrs = editor.getAttributes('link');
      setLinkUrl(attrs.href || '');
      setShowLinkInput(true);
    } else {
      // Check if there's selected text
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      
      if (selectedText) {
        // Text is selected, show input to add link
        setLinkUrl('');
        setShowLinkInput(true);
      } else {
        // No text selected, show input and will insert URL as text
        setLinkUrl('');
        setShowLinkInput(true);
      }
    }
  }, [editor]);

  const handleLinkSubmit = useCallback(() => {
    if (!editor) return;

    const url = linkUrl.trim();

    if (!url) {
      // If URL is empty, remove link if it exists
      if (editor.isActive('link')) {
        editor.chain().focus().unsetLink().run();
      }
      setShowLinkInput(false);
      setLinkUrl('');
      return;
    }

    // Ensure URL has protocol
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;

    // Check if there's selected text
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    if (selectedText || editor.isActive('link')) {
      // Update existing link or wrap selected text
      editor.chain().focus().setLink({ href: formattedUrl }).run();
    } else {
      // No text selected, insert link with URL as text
      editor.chain().focus().insertContent(`<a href="${formattedUrl}">${formattedUrl}</a>`).run();
    }

    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const handleRemoveLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor]);

  const handleOpenLink = useCallback(() => {
    if (!editor) return;
    const attrs = editor.getAttributes('link');
    if (attrs.href) {
      window.open(attrs.href, '_blank', 'noopener,noreferrer');
    }
  }, [editor]);

  const closeLinkInput = useCallback(() => {
    setShowLinkInput(false);
    setLinkUrl('');
    editor?.chain().focus().run();
  }, [editor]);

  const addImage = useCallback(() => {
    setShowImageUpload(true);
    setUploadError(null);
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const { url } = await uploadFileToMedia(file);
      
      // Insert image into editor at current cursor position
      editor.chain().focus().setImage({ src: url }).run();
      
      // Close upload section and reset
      setShowImageUpload(false);
      setUploading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
      setUploading(false);
    }
  }, [editor]);

  const closeImageUpload = useCallback(() => {
    if (!uploading) {
      setShowImageUpload(false);
      setUploadError(null);
      setImageUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [uploading]);

  // Insert an already-hosted image (e.g. a Media Library URL) at the cursor
  const insertImageFromUrl = useCallback(() => {
    const url = imageUrl.trim();
    if (!url) return;
    if (!/^(https?:\/\/|\/)/i.test(url)) {
      setUploadError('Please enter a valid image URL (starting with http:// or https://)');
      return;
    }
    editor?.chain().focus().setImage({ src: url }).run();
    setImageUrl('');
    setUploadError(null);
    setShowImageUpload(false);
  }, [editor, imageUrl]);

  // const insertTable = useCallback(() => {
  //   editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  // }, [editor]);

  // Handle Enter key in link input
  const handleLinkInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLinkSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeLinkInput();
    }
  }, [handleLinkSubmit, closeLinkInput]);

  if (!editor) return null;

  // Helper: Check if current block is a heading of specific level
  const isHeadingActive = (level: 1 | 2 | 3) => {
    return editor.isActive('heading', { level });
  };

  // Helper: Set paragraph (removes heading)
  const setParagraph = () => {
    editor.chain().focus().setParagraph().run();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 relative">
      <div className="rounded-xl overflow-hidden border border-gray-800 shadow-xl bg-black">
        {/* Toolbar */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-2 flex items-center justify-center gap-2 flex-wrap border-b border-gray-700">
          {/* Heading Buttons — NOW FIXED: Turn off when not in heading */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
              isHeadingActive(1)
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Heading1 size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
              isHeadingActive(2)
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Heading2 size={16} /> 
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
              isHeadingActive(3)
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Heading3 size={16} />
          </button>

          {/* Paragraph Button — Click to exit heading */}
          <button
            type="button"
            onClick={setParagraph}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              !editor.isActive('heading')
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Text
          </button>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          {/* Formatting Buttons - Multiple can be active simultaneously */}
          {/* Each button independently checks its active state and highlights when active */}
          {[
            { 
              icon: Bold, 
              cmd: () => editor.chain().focus().toggleBold().run(), 
              active: editor.isActive('bold'),
              label: 'Bold'
            },
            { 
              icon: Italic, 
              cmd: () => editor.chain().focus().toggleItalic().run(), 
              active: editor.isActive('italic'),
              label: 'Italic'
            },
            { 
              icon: Strikethrough, 
              cmd: () => editor.chain().focus().toggleStrike().run(), 
              active: editor.isActive('strike'),
              label: 'Strikethrough'
            },
            { 
              icon: UnderlineIcon, 
              cmd: () => editor.chain().focus().toggleUnderline().run(), 
              active: editor.isActive('underline'),
              label: 'Underline'
            },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              onClick={btn.cmd}
              title={btn.label}
              className={`p-1.5 rounded-md transition-all ${
                btn.active 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <btn.icon size={16} />
            </button>
          ))}

          <div className="w-px h-6 bg-gray-600 mx-1" />

          {/* Lists & Blocks */}
          {[
            { icon: List, cmd: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
            { icon: ListOrdered, cmd: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
            { icon: Quote, cmd: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
            { icon: Code2, cmd: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock') },
            { icon: Minus, cmd: () => editor.chain().focus().setHorizontalRule().run() },
            { icon: Link2, cmd: setLink, active: editor.isActive('link') },
            { icon: ImageIcon, cmd: addImage },
            // { icon: TableIcon, cmd: insertTable },
            { icon: Undo, cmd: () => editor.chain().focus().undo().run() },
            { icon: Redo, cmd: () => editor.chain().focus().redo().run() },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              onClick={btn.cmd}
              className={`p-1.5 rounded-md transition-all ${
                btn.active ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <btn.icon size={16} />
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="relative">
          <EditorContent editor={editor} className="bg-black min-h-[400px] max-h-[600px] overflow-y-auto" />
          
          {/* Link Input Modal - Overlay */}
          {showLinkInput && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 max-w-lg w-full shadow-2xl">
                <div className="flex items-center gap-2">
                  <input
                    ref={linkInputRef}
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={handleLinkInputKeyDown}
                    placeholder="Enter URL or search..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleLinkSubmit}
                    className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    title="Apply"
                  >
                    <Link2 size={18} />
                  </button>
                  {editor.isActive('link') && (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenLink}
                        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                        title="Open link"
                      >
                        <ExternalLink size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveLink}
                        className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors"
                        title="Remove link"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={closeLinkInput}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    title="Cancel"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image Upload Section - Overlay */}
          {showImageUpload && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Upload Image</h3>
                  <button
                    type="button"
                    onClick={closeImageUpload}
                    disabled={uploading}
                    className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Upload Area */}
                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                      uploading
                        ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
                        : 'border-purple-500 bg-gray-800/30 hover:border-purple-400 hover:bg-gray-800/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploading}
                    />
                    
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-purple-500" size={32} />
                        <p className="text-gray-300">Uploading image...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-purple-600/20 p-4 rounded-full">
                          <Upload className="text-purple-400" size={32} />
                        </div>
                        <div>
                          <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                          <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-700" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      or paste an image URL
                    </span>
                    <div className="h-px flex-1 bg-gray-700" />
                  </div>

                  {/* URL option — for images already uploaded to the Media Library */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          insertImageFromUrl();
                        }
                      }}
                      placeholder="https://…/media/your-image.jpg"
                      disabled={uploading}
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={insertImageFromUrl}
                      disabled={uploading || !imageUrl.trim()}
                      className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Insert
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Tip: copy the URL from the Media Library and paste it here — the image renders in the post instead of showing as a link.
                  </p>

                  {/* Error Message */}
                  {uploadError && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                      <p className="text-sm text-red-400">{uploadError}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Beautiful Styling */}
      {/* <style jsx global>{`
        .tiptap-editor {
          font-size: 1rem;
          color: white;
          max-width: 800px;
          margin: 0 auto;
        }
        .tiptap-editor h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin: 1rem auto;
        }
        .tiptap-editor h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          margin: 1rem auto;
        }
        .tiptap-editor h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: white;
          margin: 1rem auto;
        }
        .tiptap-editor p {
          font-size: 1rem;
          font-weight: 400;
          color: white;
          margin: 1rem auto;
        }
        .tiptap-editor strong {
          color: white;
          font-weight: 700;
        }
        .tiptap-editor em {
          color: white;
          font-style: italic;
        }
        .tiptap-editor u {
          text-decoration: underline;
          color: white;
        }
        .tiptap-editor ul {
          list-style: disc;
          padding-left: 2rem;
          color: white;
          margin: 1rem auto;
        }
        .tiptap-editor ol {
          list-style: decimal;
          padding-left: 2rem;
          color: white;
          margin: 1rem auto;
        }
        .tiptap-editor li {
          margin: 0.5rem 0;
          color: white;
        }
        .tiptap-editor blockquote {
          border-left: 4px solid #6366f1;
          padding-left: 1.5rem;
          font-style: italic;
          color: white;
          margin: 1.5rem 0;
        }
        .tiptap-editor pre {
          background: #1e1b4b;
          padding: 15px 10px;
          margin: 10px 0;
          border-radius: 12px;
          border: 1px solid #4c1d95;
          overflow-x: auto;
          color: white;
        }
        .tiptap-editor code {
          color: white;
          font-size: 0.875rem;
          background: none;
          padding: 5px 10px;
          border-radius: 4px;
        }
        .tiptap-editor table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
          color: white;
        }
        .tiptap-editor th, .tiptap-editor td {
          border: 1px solid #6366f1;
          padding: 1rem;
          color: white;
        }
        .tiptap-editor th {
          background: #312e81;
          color: white;
        }
        .tiptap-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .tiptap-editor a,
        .tiptap-editor .editor-link {
          color: #a855f7;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.2s;
        }
        .tiptap-editor a:hover,
        .tiptap-editor .editor-link:hover {
          color: #c084fc;
        }
      `}</style> */}

       {/* Beautiful Styling */}
       <style jsx global>{`
        .tiptap-editor {
          font-size: 1rem;
          color: white;
          max-width: 800px;
          margin: 0 auto;
        }
        .tiptap-editor h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin: 1rem auto;
        }
        .tiptap-editor h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          margin: 1rem auto;
        }
        .tiptap-editor h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: white;
          margin: 1rem auto;
        }
        .tiptap-editor p {
          font-size: 1rem;
          font-weight: 400;
          color: white;
          margin: 1rem auto;
        }
        .tiptap-editor strong {
          color: white;
          font-weight: 700;
        }
        .tiptap-editor em {
          color: white;
          font-style: italic;
        }
        .tiptap-editor u {
          text-decoration: underline;
          color: white;
        }
        .tiptap-editor ul {
          list-style: disc;
          padding-left: 2rem;
          color: white;
          margin: 1rem auto;
        }
        .tiptap-editor ol {
          list-style: decimal;
          padding-left: 2rem;
          color: white;
          margin: 1rem auto;
        }
        .tiptap-editor li {
          margin: 0.5rem 0;
          color: white;
        }
        .tiptap-editor blockquote {
          border-left: 4px solid #6366f1;
          padding-left: 1.5rem;
          font-style: italic;
          color: white;
          margin: 1.5rem 0;
        }
        
        /* Code Block Styling (pre) */
        .tiptap-editor pre {
          background: #1e1b4b;
          padding: 1.25rem 1rem;
          margin: 1.5rem 0;
          border-radius: 12px;
          border: 1px solid #4c1d95;
          overflow-x: auto;
          color: #e0e7ff;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        }
        
        /* Code inside pre (code blocks) */
        .tiptap-editor pre code {
          background: transparent !important;
          color: #e0e7ff !important;
          font-size: 0.875rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
          padding: 0;
          border-radius: 0;
          border: none;
          display: block;
          white-space: pre;
          overflow-x: auto;
          line-height: 1.6;
          word-wrap: normal;
          word-break: normal;
        }
        
        /* Inline code (code inside p, span, etc.) */
        .tiptap-editor p code,
        .tiptap-editor span code,
        .tiptap-editor li code,
        .tiptap-editor h1 code,
        .tiptap-editor h2 code,
        .tiptap-editor h3 code,
        .tiptap-editor code:not(pre code) {
          background: rgba(99, 102, 241, 0.2);
          color: #c4b5fd;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
          font-size: 0.875em;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          border: 1px solid rgba(99, 102, 241, 0.3);
          font-weight: 500;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        /* Code block with syntax highlighting support */
        .tiptap-editor pre[class*="language-"],
        .tiptap-editor pre[data-language] {
          background: #1e1b4b;
        }
        
        /* Syntax highlighting tokens (if using lowlight) */
        .tiptap-editor pre code .hljs-keyword,
        .tiptap-editor pre code .hljs-built_in,
        .tiptap-editor pre code .hljs-type {
          color: #c792ea;
        }
        .tiptap-editor pre code .hljs-string,
        .tiptap-editor pre code .hljs-attr {
          color: #c3e88d;
        }
        .tiptap-editor pre code .hljs-comment {
          color: #546e7a;
          font-style: italic;
        }
        .tiptap-editor pre code .hljs-number,
        .tiptap-editor pre code .hljs-literal {
          color: #f78c6c;
        }
        .tiptap-editor pre code .hljs-function,
        .tiptap-editor pre code .hljs-title {
          color: #82aaff;
        }
        .tiptap-editor pre code .hljs-variable {
          color: #ffcb6b;
        }
        .tiptap-editor pre code .hljs-punctuation {
          color: #89ddff;
        }
        
        /* Ensure code blocks don't have extra margins when inside other elements */
        .tiptap-editor p pre,
        .tiptap-editor li pre,
        .tiptap-editor blockquote pre {
          margin: 1rem 0;
        }
        
        /* Code inside blockquotes */
        .tiptap-editor blockquote code:not(pre code) {
          background: rgba(99, 102, 241, 0.25);
          border-color: rgba(99, 102, 241, 0.4);
        }
        
        /* Code inside lists */
        .tiptap-editor li code:not(pre code) {
          margin: 0 0.2em;
        }
        
        /* Scrollbar styling for code blocks */
        .tiptap-editor pre::-webkit-scrollbar {
          height: 8px;
        }
        .tiptap-editor pre::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .tiptap-editor pre::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 4px;
        }
        .tiptap-editor pre::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
        
        .tiptap-editor table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
          color: white;
        }
        .tiptap-editor th, .tiptap-editor td {
          border: 1px solid #6366f1;
          padding: 1rem;
          color: white;
        }
        .tiptap-editor th {
          background: #312e81;
          color: white;
        }
        .tiptap-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .tiptap-editor a,
        .tiptap-editor .editor-link {
          color: #a855f7;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.2s;
        }
        .tiptap-editor a:hover,
        .tiptap-editor .editor-link:hover {
          color: #c084fc;
        }
      `}</style>
    </div>
  );
};

export default Tiptap;