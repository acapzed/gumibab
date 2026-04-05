# PlanEAT 식단 API 연동 가이드

본 문서는 삼성 구미 식당(PlanEAT/웰스토리)의 식단 정보를 조회하는 데 사용된 외부(Public) API의 구조와 사용법을 안내합니다. 누구나 별도의 인증(토큰, 쿠키) 없이 사내망 외부에서도 GET 요청만으로 JSON 형태의 식단 데이터를 확보할 수 있습니다.

## Endpoint (기본 요청 주소)

```http
GET https://m.planeatchoice.net/v2/portal/dailyMenu
```

## 🛠 Query Parameters (요청 변수)

특정 식당과 특정 날짜의 데이터를 콕 집어서 가져오기 위해 주소 뒤에 파라미터를 붙여야 합니다.

| 파라미터명 | 설명 | 기본값 / 예시 | 비고 |
|---|---|---|---|
| `busiCd` | 사업부 코드 | `RH3_K_001` | 구미 사업장 공통 |
| `compCd` | 회사 구분 코드 | `K_KR_011` | - |
| `storCd` | 특정 식당 고유 코드 | `CAF38` | **"구미 2C 3식당"**을 의미함 |
| `orgTreeId`| 조직 분류 트리 ID | `0:2:3` | - |
| `saleDt` | 조회 날짜 | `YYYY-MM-DD` | 예: `2026-03-24` |
| `mealCd` | 식사 시간대 구분 | `2`(중식) / `3`(석식) | 1은 조식으로 추정됨 |

**완성된 API 요청 URL 예시:**
> `https://m.planeatchoice.net/v2/portal/dailyMenu?busiCd=RH3_K_001&compCd=K_KR_011&storCd=CAF38&orgTreeId=0:2:3&saleDt=2026-03-24&mealCd=2`

---

## Response (응답 데이터 구조)

정상적으로 호출될 경우, 아래와 같은 JSON 객체가 반환됩니다. 모든 메뉴 데이터는 `ds` 배열(Array) 안에 담겨 있습니다.

```json
{
  "ds": [
    {
      "cnrNm": "코너 A",                  // 코너 이름 (필터링 기준)
      "itemNmDp": "제육볶음 & 된장찌개",      // 메인 메뉴 이름
      "totCalorie": 850,               // 총 칼로리 (kcal)
      "protein": 32,                   // 단백질 (g)
      "carbohydrates": 90,             // 탄수화물 (g)
      "fat": 15,                       // 지방 (g)
      "fileUpload": [                  // 음식 사진 배열
        {
          "url": "http://planeatchoice.net/images/..." 
        }
      ],
      "dailySubMenuDtos": [            // 서브 메뉴(반찬) 배열
        {
          "subItemNmDp": "배추김치"
        },
        {
          "subItemNmDp": "시금치나물"
        }
      ]
    },
    // ... 추가 코너 데이터들 (코너 B, 테이크아웃, 샐러드 등)
  ]
}
```

## 주의사항 및 꿀팁 (Tip)

1. **이미지 엑스박스(Mixed Content) 주의**: 
   API 응답(JSON)의 `fileUpload[0].url` 값은 보통 `http://planeatchoice.net/...` 로 시작합니다. 웹 브라우저나 크롬 익스텐션에서 이 이미지를 바로 띄우려 하면 보안 접속(HTTPS) 정책 위반으로 차단되는 경우가 있습니다. 호출 측에서 도메인에 강제로 HTTPS와 모바일 서브도메인을 붙여 `https://m.planeatchoice.net/...` 으로 변환하여 사용하는 것을 적극 권장합니다.
2. **대상 코너 필터링**: 
   응답받은 `ds` 배열 안에는 구미 2C 3식당에서 파는 모든 코너(테이크아웃, 샐러드팩 등)가 포함되어 있습니다. 목적에 따라 `cnrNm` 속성이 "코너 A" 혹은 "코너 B"인 데이터만을 남기고 화면에 그리는 필터링 작업이 필요합니다.
