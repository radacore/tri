package handlers

import (
	"bytes"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/chai2010/webp"
	"github.com/google/uuid"
	"golang.org/x/image/draw"
	"brandingpulse/backend/internal/config"
	"brandingpulse/backend/internal/sanitize"
)

const maxUploadBytes = 10 << 20 // 10MB
const maxWidth = 2560

// UploadFile accepts multipart image (max 10MB), SVG passthrough, raster to WebP q82.
func UploadFile(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes+(1<<20))
		if err := r.ParseMultipartForm(maxUploadBytes + (1 << 20)); err != nil {
			fail(w, http.StatusBadRequest, "file too large (max 10MB)")
			return
		}
		f, hdr, err := r.FormFile("file")
		if err != nil {
			// try alternate field name "image"
			f, hdr, err = r.FormFile("image")
			if err != nil {
				fail(w, http.StatusBadRequest, "file field is required")
				return
			}
		}
		defer f.Close()
		if hdr.Size > maxUploadBytes {
			fail(w, http.StatusBadRequest, "file too large (max 10MB)")
			return
		}
		raw, err := io.ReadAll(io.LimitReader(f, maxUploadBytes+1))
		if err != nil {
			fail(w, http.StatusBadRequest, "failed to read file")
			return
		}
		if int64(len(raw)) > maxUploadBytes {
			fail(w, http.StatusBadRequest, "file too large (max 10MB)")
			return
		}
		ct := http.DetectContentType(raw)
		name := strings.ToLower(hdr.Filename)
		isSVG := strings.HasSuffix(name, ".svg") || ct == "image/svg+xml" || bytes.HasPrefix(bytes.TrimSpace(raw), []byte("<svg")) || bytes.Contains(bytes.TrimSpace(raw), []byte("<svg"))
		if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
			fail(w, http.StatusInternalServerError, "upload dir unavailable")
			return
		}
		id := uuid.NewString()
		if isSVG {
			// SVG passthrough: basic sanity (must look like XML/SVG)
			trimmed := bytes.TrimSpace(raw)
			if !(bytes.HasPrefix(trimmed, []byte("<")) && bytes.Contains(trimmed, []byte("svg"))) {
				fail(w, http.StatusBadRequest, "invalid SVG file")
				return
			}
			// H1: allowlist-sanitize agar <script>/event handler tak tersimpan
			clean := sanitize.SanitizeSVG(string(raw))
			if strings.TrimSpace(clean) == "" {
				fail(w, http.StatusBadRequest, "SVG rejected by sanitizer")
				return
			}
			raw = []byte(clean)
			fname := id + ".svg"
			if err := os.WriteFile(filepath.Join(cfg.UploadDir, fname), raw, 0o644); err != nil {
				fail(w, http.StatusInternalServerError, "failed to save file")
				return
			}
			ok(w, map[string]any{
				"url": "/uploads/" + fname, "width": nil, "height": nil,
				"size_kb": float64(len(raw)) / 1024.0, "format": "svg",
			})
			return
		}
		if !strings.HasPrefix(ct, "image/") {
			fail(w, http.StatusBadRequest, "only image files are allowed")
			return
		}
		img, _, err := image.Decode(bytes.NewReader(raw))
		if err != nil {
			fail(w, http.StatusBadRequest, "unsupported image format")
			return
		}
		bounds := img.Bounds()
		srcW, srcH := bounds.Dx(), bounds.Dy()
		dstW, dstH := srcW, srcH
		if srcW > maxWidth {
			dstW = maxWidth
			dstH = int(float64(srcH) * float64(maxWidth) / float64(srcW))
			if dstH < 1 {
				dstH = 1
			}
			dst := image.NewRGBA(image.Rect(0, 0, dstW, dstH))
			draw.ApproxBiLinear.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)
			img = dst
		}
		var buf bytes.Buffer
		if err := webp.Encode(&buf, img, &webp.Options{Lossless: false, Quality: 82}); err != nil {
			fail(w, http.StatusInternalServerError, "failed to encode webp")
			return
		}
		fname := id + ".webp"
		if err := os.WriteFile(filepath.Join(cfg.UploadDir, fname), buf.Bytes(), 0o644); err != nil {
			fail(w, http.StatusInternalServerError, "failed to save file")
			return
		}
		ok(w, map[string]any{
			"url":     "/uploads/" + fname,
			"width":   dstW,
			"height":  dstH,
			"size_kb": float64(buf.Len()) / 1024.0,
			"format":  "webp",
		})
	}
}

var _ = fmt.Sprintf
