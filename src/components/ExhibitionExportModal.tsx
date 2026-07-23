import React, { useRef, useEffect } from 'react';
import { CanvasItem, ExhibitionMeta } from '../types';
import { X, Download, Share2, Award, BookOpen, Sparkles, PenLine, Loader, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { playChimeSound, playClickSound } from '../utils/soundEffects';

const PLACEHOLDER_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23292620' width='200' height='200'/%3E%3Ctext fill='%2399927a' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='serif' font-size='14'%3EImage Unavailable%3C/text%3E%3C/svg%3E";

interface ExhibitionExportModalProps {
  items: CanvasItem[];
  exhibitionMeta: ExhibitionMeta;
  setExhibitionMeta: React.Dispatch<React.SetStateAction<ExhibitionMeta>>;
  onClose: () => void;
  soundEnabled: boolean;
}

export const ExhibitionExportModal: React.FC<ExhibitionExportModalProps> = ({
  items,
  exhibitionMeta,
  setExhibitionMeta,
  onClose,
  soundEnabled,
}) => {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [narrative, setNarrative] = React.useState<string | null>(null);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = React.useState(false);
  const soundEnabledOnMount = useRef(soundEnabled);

  useEffect(() => {
    if (soundEnabledOnMount.current) playChimeSound();
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#d4af37', '#fef08a', '#9a3412', '#78350f'],
    });
  }, []); // fire once on mount regardless of soundEnabled changes

  // Open print-friendly museum brochure in new window for PDF export
  const handleDownloadBrochure = () => {
    const catalogHtml = items
      .map(
        (item, idx) =>
          `<div class="plate">
            <div class="plate-number">Plate ${idx + 1}</div>
            <div class="plate-img">
              <img src="${item.artwork.thumbUrl}" alt="${item.artwork.title}" crossorigin="anonymous" />
            </div>
            <div class="plate-info">
              <div class="plate-title">${item.artwork.title}</div>
              <div class="plate-artist">${item.artwork.artist || 'Unknown Artist'}${item.artwork.date ? ', ' + item.artwork.date : ''}</div>
              <div class="plate-meta">${item.artwork.museum} &middot; ${item.artwork.medium} &middot; ${item.artwork.license}</div>
              <div class="plate-caption">${item.artwork.caption}</div>
            </div>
          </div>`
      )
      .join('');

    const narrativeHtml = narrative
      ? `<div class="essay">
          <h2>Curatorial Essay</h2>
          <div class="essay-rule">&#10087;</div>
          ${narrative.split('\n\n').map((p, i) => `<p${i === 0 ? ' class="drop-cap"' : ''}>${p}</p>`).join('')}
        </div>`
      : '';

    const brochure = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${exhibitionMeta.title} &mdash; Exhibition Brochure</title>
<style>
  @page {
    size: A4;
    margin: 20mm 18mm;
    @bottom-center {
      content: counter(page);
      font-family: 'Crimson Text', Georgia, serif;
      font-size: 10px;
      color: #999;
    }
  }

  * { box-sizing: border-box; }

  body {
    font-family: 'Crimson Text', Georgia, 'Times New Roman', serif;
    background: #faf7f2;
    color: #2c2416;
    margin: 0;
    padding: 0;
    line-height: 1.6;
    font-size: 13px;
  }

  .brochure {
    max-width: 190mm;
    margin: 0 auto;
    padding: 0;
  }

  /* ── Cover ── */
  .cover {
    text-align: center;
    padding: 60px 40px 40px;
    page-break-after: always;
    border: 2px solid #8b7355;
    margin-bottom: 30px;
    background: linear-gradient(to bottom, #faf7f2 0%, #f0ead6 50%, #faf7f2 100%);
  }
  .cover-ornament {
    font-size: 36px;
    color: #8b7355;
    letter-spacing: 12px;
    margin-bottom: 24px;
  }
  .cover h1 {
    font-family: 'Playfair Display', 'Crimson Text', Georgia, serif;
    font-size: 36px;
    font-weight: 700;
    color: #3d2b1a;
    letter-spacing: 2px;
    line-height: 1.2;
    margin: 0 0 16px 0;
    text-transform: uppercase;
  }
  .cover .subtitle {
    font-size: 16px;
    font-style: italic;
    color: #6b5b4a;
    margin-bottom: 32px;
  }
  .cover .divider {
    width: 80px;
    height: 2px;
    background: #8b7355;
    margin: 0 auto 24px;
  }
  .cover .meta {
    font-size: 13px;
    color: #6b5b4a;
    letter-spacing: 1px;
  }
  .cover .meta strong {
    display: block;
    font-size: 15px;
    color: #3d2b1a;
    font-weight: normal;
    font-style: italic;
  }

  /* ── Essay ── */
  .essay {
    padding: 0 10px;
    margin-bottom: 40px;
    page-break-before: always;
  }
  .essay h2 {
    font-family: 'Playfair Display', 'Crimson Text', Georgia, serif;
    font-size: 22px;
    text-align: center;
    color: #3d2b1a;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .essay-rule {
    text-align: center;
    font-size: 18px;
    color: #8b7355;
    margin-bottom: 24px;
  }
  .essay p {
    font-size: 14px;
    line-height: 1.75;
    text-align: justify;
    margin: 0 0 14px 0;
    text-indent: 1.5em;
  }
  .essay p.drop-cap:first-letter {
    float: left;
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 64px;
    line-height: 0.8;
    padding-right: 8px;
    padding-top: 4px;
    color: #8b7355;
  }

  /* ── Catalog ── */
  .catalog-header {
    text-align: center;
    margin-bottom: 32px;
    page-break-before: always;
  }
  .catalog-header h2 {
    font-family: 'Playfair Display', 'Crimson Text', Georgia, serif;
    font-size: 22px;
    letter-spacing: 2px;
    color: #3d2b1a;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .catalog-header .rule {
    font-size: 14px;
    color: #8b7355;
    letter-spacing: 6px;
  }

  .catalog {
    column-count: 2;
    column-gap: 28px;
    column-rule: 1px solid #d4c8b0;
  }

  .plate {
    break-inside: avoid;
    margin-bottom: 28px;
    border-bottom: 1px dotted #d4c8b0;
    padding-bottom: 20px;
  }
  .plate-number {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 11px;
    color: #8b7355;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .plate-img {
    text-align: center;
    margin-bottom: 10px;
    background: #f0ead6;
    padding: 8px;
    border: 1px solid #d4c8b0;
  }
  .plate-img img {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    display: block;
    margin: 0 auto;
  }
  .plate-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 15px;
    font-weight: 700;
    color: #3d2b1a;
    margin-bottom: 2px;
    font-style: italic;
  }
  .plate-artist {
    font-size: 12px;
    color: #5c4a3a;
    margin-bottom: 4px;
  }
  .plate-meta {
    font-size: 10px;
    color: #8b7355;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .plate-caption {
    font-size: 11px;
    color: #6b5b4a;
    line-height: 1.5;
    font-style: italic;
  }

  /* ── Colophon ── */
  .colophon {
    text-align: center;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid #8b7355;
    font-size: 10px;
    color: #8b7355;
    letter-spacing: 1px;
    line-height: 1.8;
  }
  .colophon .ornament {
    font-size: 16px;
    margin-bottom: 12px;
    letter-spacing: 8px;
  }

  @media print {
    body { background: white; }
    .cover { background: white; border: 2px solid #8b7355; }
  }
</style>
</head>
<body>
<div class="brochure">

  <!-- Cover -->
  <div class="cover">
    <div class="cover-ornament">&#10087;</div>
    <h1>${exhibitionMeta.title}</h1>
    <div class="subtitle">An Exhibition Assembled by ${exhibitionMeta.curatorName || 'the Lead Curator'}</div>
    <div class="divider"></div>
    <div class="meta">
      <strong>${items.length} Works</strong>
      from ${museums.length} International Collections
    </div>
  </div>

  ${narrativeHtml}

  <!-- Catalog -->
  <div class="catalog-header">
    <h2>Exhibition Checklist</h2>
    <div class="rule">&#10087;</div>
  </div>

  <div class="catalog">
    ${catalogHtml}
  </div>

  <!-- Colophon -->
  <div class="colophon">
    <div class="ornament">&#10087;</div>
    ${narrative ? 'Curatorial essay composed by <strong>Wikimedia LiftWing LLM</strong> (llm-qwen36-27b),<br>a free AI service hosted by the Wikimedia Foundation.<br><br>' : ''}
    All images courtesy of <strong>Wikimedia Commons</strong>.<br>
    Produced with <strong>Curator&rsquo;s Belt</strong> &mdash; the ambient museum collection game.<br>
    <br>
    ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
  </div>

</div>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (w) {
      w.document.write(brochure);
      w.document.close();
      // Give images a moment to load, then trigger print dialog
      setTimeout(() => w.print(), 1500);
    }
  };

  const handleDownloadPNG = async () => {
    if (!galleryRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(galleryRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#12100e',
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${exhibitionMeta.title.replace(/\s+/g, '_')}_Gallery.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to render PNG', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Unique museums represented
  const museums = Array.from(new Set(items.map((i) => i.artwork.museum)));

  // Generate AI exhibition narrative via Wikimedia LiftWing LLM
  const handleGenerateNarrative = async () => {
    setIsGeneratingNarrative(true);
    try {
      const catalogLines = items.map(
        (item, idx) =>
          `${idx + 1}. "${item.artwork.title}" (${item.artwork.artist || 'Unknown Artist'}, ${item.artwork.date || ''}). Collection of ${item.artwork.museum}.`
      );
      const catalogText = catalogLines.join('\n');

      const prompt = `If I have a portfolio of these artworks, write a possible narrative of an art exhibition for them. Write 2-3 paragraphs that tie these works together thematically, historically, or emotionally. Be evocative and poetic but grounded in art history. Do not repeat the list of artworks — the list will be shown separately.\n\n${catalogText}`;

      const response = await fetch(
        'https://api.wikimedia.org/service/lw/inference/v1/models/llm-qwen36-27b/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llm-qwen36-27b',
            messages: [{ role: 'user', content: prompt }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      setNarrative(text.trim());
    } catch (err) {
      console.error('Failed to generate narrative', err);
      setNarrative(null);
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-lg animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto bg-stone-900 border border-amber-800/60 rounded-xl shadow-2xl overflow-hidden flex flex-col text-stone-200">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950 border-b border-amber-900/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif text-lg font-bold text-amber-100">
              Exhibition Presentation & Gallery Wall
            </h2>
          </div>
          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Gallery Canvas Capture Container */}
          <div
            ref={galleryRef}
            className="relative p-8 rounded-lg bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 border-2 border-amber-900/40 shadow-2xl overflow-hidden min-h-[400px] flex flex-col justify-between"
          >
            {/* Top Spotlight Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

            {/* Artworks Display Wall */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-center justify-items-center mb-8 relative z-10">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-center group transform transition duration-300 hover:scale-105"
                >
                  <div className="p-2 bg-stone-900 border-4 border-amber-700/60 shadow-2xl rounded-sm">
                    <img
                      src={item.artwork.thumbUrl}
                      alt={item.artwork.title}
                      className="max-h-48 object-contain rounded-xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_SRC;
                      }}
                    />
                  </div>
                  <div className="mt-2 text-center max-w-[180px]">
                    <p className="font-serif text-xs font-semibold text-amber-200 truncate">
                      {item.artwork.title}
                    </p>
                    <p className="text-[10px] text-stone-400 font-serif italic truncate">
                      {item.artwork.artist || 'Unknown'} • {item.artwork.museum}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Brass Exhibition Plaque */}
            <div className="relative z-10 mx-auto max-w-xl bg-gradient-to-r from-amber-950 via-yellow-950 to-amber-950 border-2 border-amber-500/80 p-6 rounded-md shadow-2xl text-center text-amber-100 space-y-2">
              <div className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold border-b border-amber-700/50 pb-1 inline-block">
                Curated Exhibition Plaque
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-wide text-amber-100">
                {exhibitionMeta.title}
              </h1>
              <p className="text-xs font-serif italic text-amber-200/80">
                Curated by {exhibitionMeta.curatorName || 'Anonymous Curator'}
              </p>
              <p className="text-xs font-sans text-stone-300/90 leading-relaxed pt-1">
                {exhibitionMeta.description ||
                  `A curated assemblage featuring ${items.length} masterworks across ${museums.length} renowned global collections.`}
              </p>
              <div className="pt-2 text-[10px] font-mono text-amber-400/80 uppercase tracking-wider flex justify-center gap-4">
                <span>{items.length} Artworks</span>
                <span>•</span>
                <span>{museums.length} Museums</span>
              </div>
            </div>
          </div>

          {/* Exhibition Controls & Metadata Editing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-950 p-4 rounded-lg border border-stone-800 text-xs">
            <div>
              <label className="block text-amber-400 font-mono uppercase mb-1">
                Exhibition Title
              </label>
              <input
                type="text"
                value={exhibitionMeta.title}
                onChange={(e) =>
                  setExhibitionMeta((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-amber-400 font-mono uppercase mb-1">
                Curator Name
              </label>
              <input
                type="text"
                value={exhibitionMeta.curatorName}
                onChange={(e) =>
                  setExhibitionMeta((prev) => ({ ...prev, curatorName: e.target.value }))
                }
                className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-amber-400 font-mono uppercase mb-1">
                Exhibition Statement / Notes
              </label>
              <textarea
                value={exhibitionMeta.description}
                onChange={(e) =>
                  setExhibitionMeta((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
                className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* AI-Generated Exhibition Narrative */}
          <div className="bg-stone-950 p-4 rounded-lg border border-stone-800 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-amber-200 flex items-center gap-1.5">
                <PenLine className="w-4 h-4 text-amber-400" />
                AI Exhibition Narrative
              </h3>
              <button
                onClick={handleGenerateNarrative}
                disabled={isGeneratingNarrative}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-900/60 hover:bg-amber-800/60 text-amber-200 text-xs font-medium transition border border-amber-700/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingNarrative ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Narrative</span>
                  </>
                )}
              </button>
            </div>
            {narrative ? (
              <div className="bg-stone-900/80 border border-amber-800/30 rounded-lg p-5 font-serif text-base text-stone-200 leading-relaxed italic">
                {narrative.split('\n\n').map((paragraph, i) => (
                  <p key={i} className={i > 0 ? 'mt-3' : ''}>
                    {paragraph}
                  </p>
                ))}
                <div className="mt-4 pt-3 border-t border-amber-800/20 text-[11px] text-stone-500 not-italic font-sans leading-relaxed">
                  <span className="text-amber-500/70 font-mono uppercase tracking-wider">AI Attribution</span>
                  <br />
                  Generated by{' '}
                  <span className="text-stone-400 font-medium">Wikimedia LiftWing LLM</span>
                  {' '}(model:{' '}
                  <a
                    href="https://wikitech.wikimedia.org/wiki/Machine_Learning/LiftWing/Large_Language_Models/Wikimania_2026"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400/80 hover:text-amber-300 underline"
                  >
                    llm-qwen36-27b
                  </a>
                  ), a free, non-commercial AI service hosted by the Wikimedia Foundation. The model was prompted to compose an exhibition narrative connecting the artworks selected by the curator.
                </div>
              </div>
            ) : (
              !isGeneratingNarrative && (
                <p className="text-stone-500 italic text-xs">
                  Click &ldquo;Generate Narrative&rdquo; to create an AI-written exhibition story tying your selected artworks together.
                </p>
              )
            )}
            {isGeneratingNarrative && (
              <div className="bg-stone-900/80 border border-amber-800/20 rounded-lg p-6 flex items-center justify-center">
                <div className="flex items-center gap-3 text-stone-400">
                  <Loader className="w-5 h-5 animate-spin text-amber-400" />
                  <span className="font-serif text-sm italic">Composing your exhibition narrative&hellip;</span>
                </div>
              </div>
            )}
          </div>

          {/* Catalog & License Credits */}
          <div className="bg-stone-950 p-4 rounded-lg border border-stone-800 text-xs space-y-2">
            <h3 className="font-serif font-bold text-amber-200 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Exhibition Catalog & Academic Citations
            </h3>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
              {items.map((item, idx) => (
                <div key={idx} className="text-stone-400 border-b border-stone-900 pb-1">
                  <span className="font-semibold text-amber-100">{idx + 1}. "{item.artwork.title}"</span>{' '}
                  ({item.artwork.artist}, {item.artwork.date}). Collection of {item.artwork.museum}.{' '}
                  <span className="text-stone-500 font-mono">[{item.artwork.license}]</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-stone-950 border-t border-amber-900/40 flex items-center justify-between">
          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              onClose();
            }}
            className="px-4 py-2 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
          >
            Back to Canvas
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadBrochure}
              className="flex items-center space-x-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs px-4 py-2.5 rounded border border-stone-600 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Download Brochure PDF</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              disabled={isExporting}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-serif font-bold text-xs px-5 py-2.5 rounded shadow-lg transition"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating High-Res PNG...' : 'Download Exhibition PNG'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
