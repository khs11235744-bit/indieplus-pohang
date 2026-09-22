# INDIE PORT Firebase 전환

## 구조
- `sync_cinema`: 30분마다 Dtryx 인디플러스 포항 공개 편성을 읽어 Firestore `public/live`, `public/movies`, `public/programs` 갱신
- `sync_news`: 6시간마다 Google News RSS 기반 주요 독립·예술영화/지역 예술 소식을 선별해 `public/news-weekly` 갱신
- 웹앱: Firestore를 먼저 읽고 실패/미설정 시 기존 `data/*.json`으로 자동 복귀
- 기존 JSON 파일은 장애 시 마지막 정상 데이터 역할을 유지

## 최초 1회
1. 저장소 루트에서 `firebase login`
2. `firebase use --add` 로 사용할 Firebase 프로젝트 선택
3. Firestore 데이터베이스가 없다면 Firebase Console에서 생성
4. Functions 배포를 위해 프로젝트를 Blaze 요금제로 전환
5. `firebase deploy --only firestore:rules,functions,hosting`

## 확인
- Firebase Console > Firestore > `public/live`, `public/movies`, `public/news-weekly`
- Cloud Functions > `sync_cinema`, `sync_news`
- `public/sync-status`에서 마지막 성공/실패 상태 확인

## GitHub Pages를 계속 병행하는 경우
Firebase Hosting이 아닌 주소에서는 `firebase-config.example.json`을 복사해 `firebase-config.json`으로 만들고 Web App 설정값을 넣으면 Firestore를 읽는다. 설정 파일이 없으면 기존 JSON만 사용한다.