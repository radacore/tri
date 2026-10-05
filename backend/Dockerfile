FROM golang:1.26-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server ./cmd/server
FROM alpine:latest
RUN adduser -D -u 10001 appuser
WORKDIR /app
COPY --from=build /app/server .
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app
USER appuser
VOLUME ["/app/uploads"]
EXPOSE 8080
CMD ["./server"]
