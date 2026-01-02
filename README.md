# Energy Management System - Client

AIoT 기반 지능형 에너지 관리 시스템의 클라이언트입니다.

LLM과 MCP(Model Context Protocol)를 결합하여 자연어 기반 에너지 관리 인터페이스를 구현했습니다.
사용자는 대화를 통해 전력 데이터 조회, TimesFM 기반 시계열 예측, IoT 기기 제어를 수행할 수 있습니다.
SSE(Server-Sent Events) 스트리밍으로 실시간 응답을 제공하며,
분위수 기반 예측으로 불확실성 구간까지 시각화하여 데이터 기반 의사결정을 지원합니다.

## 수상

🏆 **2025 Advantech AIoT Innoworks Project** 우수상 (3등)

## 시스템 아키텍처

<img width="948" height="581" alt="프로젝트 아키텍쳐" src="https://github.com/user-attachments/assets/67fef7a4-ee1f-42db-8adf-74798eed70af" />

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **API Communication**: SSE (Server-Sent Events)

## 시작하기

### 요구사항

- Node.js >= 18.18.0

### 설치 및 실행

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
```

### 환경 변수

```bash
# .env.local
NEXT_PUBLIC_API_URL=<백엔드 API 주소>
```

## 프로젝트 구조

```
app/
├── _api/           # API 통신 레이어 (재시도, 타임아웃, 에러 처리)
├── _lib/           # 비즈니스 로직
├── _hooks/         # 커스텀 React Hooks
├── _components/    # UI 컴포넌트
├── chat/[id]/      # 동적 채팅방 페이지
└── types.ts        # TypeScript 타입 정의
```

## 주요 설계 결정

### SSE 스트리밍

실시간 응답을 위한 Server-Sent Events 구현:

```typescript
const response = await createChatRoom(question, {
  onAnswerChunk: ({ chunk, accumulated }) => {
    setStreamingAnswer(accumulated);
  },
});
```

#### 비교 예시: 전체 응답 완료 후 → 스트리밍 즉시 표시

![SSE 비교 gif](https://github.com/user-attachments/assets/5ce7b12d-55fc-4ee4-912c-9ef30a92acac)


### API 레이어 분리

관심사 분리 원칙에 따라 `_api/` 디렉토리에서 통신 로직을 분리:

- 지수 백오프 기반 자동 재시도
- AbortController를 활용한 타임아웃 처리
- 커스텀 에러 클래스(`ChatApiError`)를 통한 에러 정규화

### 커스텀 훅 패턴

UI 로직과 비즈니스 로직을 분리하여 재사용성과 테스트 용이성 확보:

- `useChatMessaging`: 메시지 전송/수신 및 스트리밍 상태 관리
- `useChatRoomList`: 채팅방 목록 조회 및 무한 스크롤
- `useAutoScroll`: 스트리밍 응답 시 자동 스크롤 (사용자 스크롤 시 비활성화)

### 타입 안전성

대형 정수 ID의 JSON 파싱 시 JavaScript Number 정밀도 손실 방지를 위한 문자열 정규화:

```typescript
function normalizeIdValue(value: unknown): string {
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') {
    try { return BigInt(value).toString(); } 
    catch { return value; }
  }
  return String(value);
}
```

## 개발 도구

- **ESLint**: `next/core-web-vitals`, `next/typescript` 규칙 적용
- **TypeScript**: strict 모드
