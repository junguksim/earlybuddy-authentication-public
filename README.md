# earlybuddy-authentication-server

## 소개

- 일정 및 대중교통 초개인화 스케쥴링 서비스, "얼리버디"의 인증 서버입니다.
- 프로젝트 기간 : 2021.02~
- 기술 스택
  - `node.js` + `typescript`
  - `NestJS` 
  - `MySQL` + `typeorm`
  - `docker` with `docker-compose` 
  - Hosting with `AWS EC2` + `AWS RDS`
  - `redis`

## 프로젝트 구조

![eb-3rd-architecture](https://user-images.githubusercontent.com/44252639/115953822-acb8d000-a528-11eb-80af-06cf9fe0ad76.png)

## 주요 기능

1. 일정 관리
   1. 간단한 사용자의 일정을 등록하는 기능(일정 이름 및 시간)
   2. 자세하게 사용자의 일정을 등록하는 기능(출발 및 도착지, 날짜 및 시간)
      1. 약속한 시간에 늦지 않기 위해 타야하는 지하철 및 버스의 알림을 몇 분 전부터, 몇 개의 교통편에 대해 받을 지 설정
      2. Google Firebase 의 Push Notification 으로 푸시 알림
2. 지하철 및 버스 시간 계산 기능
   1. 일정 등록 시, 약속한 시간에 늦지 않기 위해 타야하는 지하철 및 버스의 도착 시간을, 원하는 갯수의 교통편만큼 가져오는 기능
   2. 지하철의 경우 ODSay API 에서, 버스의 경우 공공 데이터 API를 통해 데이터를 가져온 뒤 필요한 데이터를 가공
3. 주소 검색 기능
   1. Kakao Local API 를 통해 사용자의 출발지 및 도착지를 질의어를 통해 검색
4. 대중교통 경로 검색 기능
   1. ODSay API 를 통해 가져온 대중교통 경로 데이터를 기반
   2. 소요시간, 배차간격, 총 비용, 총 도보 시간, 환승 횟수 등을 고려한 자체 알고리즘으로 최적 경로 설정
5. 캘린더 기능
   1. 이번 주나, 이번 달, 다른 달의 일정들을 한 눈에 파악할 수 있는 기능
6. **인증 기능** (이 프로젝트는 인증 기능만을 포함합니다)
   1. 로컬 회원가입 및 로그인 기능
      1. 휴대폰 번호로 문자 인증을 통해 회원 가입
      2. JWT 토큰 인증 방식
      3. 로그아웃 시 redis 에 jwt를 저장해 Blacklist 화
   2. 소셜 로그인 기능 추가 예정

## 참여자

- [심정욱](https://github.com/junguksim) - 전체 기능 담당