# 인하대학교 전력 통합관리 시스템

인하대학교 건물별 실시간 전력 데이터를 활용한 AI 기반 전력 관리 및 이상 감지 시스템입니다.

## 해결하고자 하는 문제

인하대학교는 각 건물별로 실시간 전력 데이터를 수집·저장하고 있지만, 이를 체계적으로 분석하고 활용하는 시스템이 부재했습니다.

본 프로젝트는 다음 문제를 해결합니다:

- **전력 사용 패턴 분석**: 사전 학습된 시계열 예측 모델을 활용하여 전력 사용량을 예측하고 최적화 방안을 제시합니다.
- **이상 징후 조기 감지**: 전력량 추이를 모니터링하여 비정상적인 패턴 발생 시 사용자에게 즉시 알림을 제공합니다.
- **통합 매뉴얼 제공**: 이상 감지 시 해당 상황에 맞는 대응 매뉴얼(전력 예측 모델 해석, 사고 예방 가이드, 전력 제어 방법 등)을 AI 챗봇을 통해 안내합니다.

## 프로젝트 전체 아키텍쳐
<img width="948" height="581" alt="프로젝트 아키텍쳐" src="https://github.com/user-attachments/assets/67fef7a4-ee1f-42db-8adf-74798eed70af" />

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: React Hooks + LocalStorage
- **API Communication**: SSE (Server-Sent Events) 스트리밍

## 프로젝트 구조

```
app/
├── _api/              # API 통신 레이어
│   ├── chat.ts        # 채팅 API (생성, 전송, 삭제)
│   ├── client.ts      # HTTP 클라이언트 (재시도, 타임아웃)
│   ├── errors.ts      # 에러 핸들링
│   ├── headers.ts     # 요청 헤더 관리
│   └── utils.ts       # 유틸리티 함수
├── _lib/              # 비즈니스 로직
│   ├── chatOperations.ts   # 채팅 작업 처리
│   ├── chatRoomList.ts     # 채팅방 목록 관리
│   ├── storage.ts          # 로컬 스토리지 관리
│   └── ...
├── _hooks/            # 커스텀 React Hooks
│   └── useChatRoomList.ts
├── _components/       # UI 컴포넌트
│   ├── chat/          # 채팅 관련 컴포넌트
│   ├── ChatRoomList.tsx
│   └── ...
├── chat/
│   └── [id]/          # 동적 채팅방 페이지
└── types.ts           # TypeScript 타입 정의
```

## 주요 설계 결정

### API 레이어 분리

`_api/` 디렉토리에서 API 통신 로직을 분리하여 관리합니다:

- **재시도 로직**: 네트워크 오류 시 지수 백오프로 자동 재시도
- **타임아웃 처리**: AbortController를 활용한 요청 타임아웃
- **에러 정규화**: 다양한 에러 타입을 일관된 형식으로 변환

### SSE 스트리밍

실시간 응답을 위해 Server-Sent Events를 사용합니다:

```typescript
// 스트리밍 응답 처리 예시
const response = await createChatRoom(question, {
  onAnswerChunk: ({ chunk, accumulated }) => {
    setStreamingAnswer(accumulated);
  },
});
```

### 타입 안전성

BigInt ID 값의 정밀도 손실을 방지하기 위해 문자열로 정규화합니다:

```typescript
function normalizeIdValue(value: unknown): string {
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') {
    try { return BigInt(value).toString(); } 
    catch { return value; }
  }
  // ...
}
```

## 개발 도구

- **ESLint**: `next/core-web-vitals`, `next/typescript` 규칙 적용
- **TypeScript**: 엄격한 타입 체크
- **Tailwind CSS**: 유틸리티 기반 스타일링
