# INDIE+ POHANG 개발 하네스

## 목표
포항에서 독립영화를 발견 → 상세정보 확인 → 상영시간 선택 → Dtryx 예매 → 관람기록 → 비평으로 이어지는 모바일 우선 플랫폼.

## 매 실행 루프
1. `git status -sb`와 최근 커밋을 확인한다.
2. 원격 PC에서 `python scripts/sync_dtryx.py`로 실제 상영편성을 갱신한다.
3. 새 MovieCd가 보이면 Dtryx 영화 상세의 포스터·줄거리·감독·배우·장르·스틸·예고편을 `data/movies.json`에 보강한다.
4. `ROADMAP_100.md`에서 아직 미완료인 가장 높은 우선순위 항목을 구현한다.
5. 가짜 상영작·가짜 시간·근거 없는 줄거리를 넣지 않는다.
6. 모바일 390×844와 데스크톱 1440×1100 기준을 모두 확인한다.
7. JSON 검증, `node --check app.js`, `node --check sw.js`, `git diff --check`를 수행한다.
8. 의미 있는 단위로 commit/push한다.
9. GitHub Pages 공개본에서 새 콘텐츠가 내려오는지 확인한다.
10. 완료 작업·테스트·커밋 SHA·다음 작업을 보고한다.

## 데이터 원칙
- 영화관: 인디플러스 포항 / Dtryx CinemaCd `000057`
- 상영편성: Dtryx 공개 상영 데이터
- 영화설명: Dtryx 공개 영화 상세정보 우선
- 카드용 한줄소개는 공식 줄거리의 의미를 바꾸지 않는 범위에서 짧게 편집
- Dtryx 접속이 실패하면 마지막 정상 `data/live.json`을 유지
- GitHub hosted runner에서는 Dtryx가 timeout되므로 데이터 갱신은 Remote Commander가 연결된 PC를 우선 사용

## v0.4 실행 규칙
- GitHub hosted runner에서는 Dtryx 접속 timeout이 확인되었으므로 Dtryx 동기화 GitHub Action을 만들지 않는다.
- 데이터 갱신 순서: `sync_dtryx.py` → `enrich_public_apis.py` → `cache_share_assets.py`.
- KOBIS_KEY / KMDB_KEY / TMDB_TOKEN이 없으면 해당 공급자는 건너뛰고 Dtryx + Wikimedia로 계속 동작한다.
- 공유카드는 `data/share-assets.json`의 로컬 스틸을 우선 사용한다.
- 기능 수정 후 `node --check app.js`, `node --check features-v04.js`, JSON 검증, `git diff --check`를 반드시 통과한다.
- 가능하면 로컬 HTTP 서버 + Chrome DevTools에서 `node scripts/probe_v04.mjs` 스모크 테스트를 실행한다.
- 사용자가 대화 중 직접 개발을 진행 중일 때 시간별 자동 실행은 같은 파일을 동시에 수정하지 않는다. 충돌 가능성이 있으면 상태만 보고하고 다음 실행으로 넘긴다.
- 테스트용 .chrome-* 디렉터리와 mobile/desktop/tablet 캡처 파일은 커밋하지 않는다.

## v0.5 커뮤니티·공유 확장
- 핵심 추가 기능: 로컬 커뮤니티 게시판, 좋아요, 댓글, 0.5 별점, 태그, 스포일러, 기기 프로필, 다중 스틸 공유, 5종 프리셋, 도장, 비평 잡지함.
- `features-v05.js`를 기존 v0.4 위에 확장층으로 유지한다.
- 공유 데이터 갱신 시 `sync_dtryx.py`로 stills 배열을 확보하고 `cache_share_assets.py`로 영화당 최대 4장 스틸을 캐시한다.
- 테스트는 `node scripts/probe_v05.mjs`를 우선 사용한다.
- 커뮤니티는 현재 localStorage 베타이므로 실제 다중 사용자 서버처럼 표현하지 않는다.
- Google/Kakao/Naver는 OAuth 키가 연결되기 전까지 기기 프로필 모드로 유지한다.
- 다음 서버 단계에서 게시글/댓글/좋아요/프로필을 클라우드 DB로 마이그레이션할 수 있도록 데이터 구조를 유지한다.
- 제품 개선 기준은 `COMMUNITY_ROADMAP_100.md`를 따른다.
