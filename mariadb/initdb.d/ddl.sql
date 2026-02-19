CREATE TABLE `user` (
	`no` INT(11) NOT NULL AUTO_INCREMENT COMMENT '번호',
	`name` VARCHAR(20) NOT NULL COMMENT '이름' COLLATE 'utf8mb4_unicode_ci',
	`email` VARCHAR(255) NOT NULL COMMENT '이메일' COLLATE 'utf8mb4_unicode_ci',
	`gender` TINYINT(1) NULL DEFAULT NULL COMMENT '성별(0:여자, 1:남자)',
	`del_yn` TINYINT(1) NOT NULL DEFAULT '0' COMMENT '탈퇴여부(0:회원, 1: 탈퇴)',
	`reg_date` DATETIME NOT NULL DEFAULT current_timestamp() COMMENT '회원등록일자',
	`mod_date` DATETIME NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '회원정보수정일자',
	`origin` VARCHAR(200) NULL DEFAULT NULL COMMENT '파일이름' COLLATE 'utf8mb4_unicode_ci',
	`ext` VARCHAR(5) NULL DEFAULT NULL COMMENT '확장자' COLLATE 'utf8mb4_unicode_ci',
	`new_name` VARCHAR(50) NULL DEFAULT NULL COMMENT '신규이름' COLLATE 'utf8mb4_unicode_ci',
	PRIMARY KEY (`no`) USING BTREE,
	UNIQUE INDEX `email` (`email`) USING BTREE
)
COMMENT='사용자'
COLLATE='utf8mb4_unicode_ci'
ENGINE=InnoDB
;


CREATE TABLE `login` (
	`id` VARCHAR(40) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`user_no` INT(11) NOT NULL,
	`token` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`reg_date` DATETIME NOT NULL DEFAULT current_timestamp() COMMENT '등록일자'
)
COMMENT='로그인'
COLLATE='utf8mb4_unicode_ci'
ENGINE=InnoDB
;



CREATE TABLE `board` (
	`no` INT(11) NOT NULL AUTO_INCREMENT COMMENT '번호',
	`title` VARCHAR(40) NOT NULL COMMENT '제목' COLLATE 'utf8mb4_unicode_ci',
	`content` VARCHAR(255) NULL DEFAULT NULL COMMENT '내용' COLLATE 'utf8mb4_unicode_ci',
	`del_yn` TINYINT(1) NOT NULL DEFAULT '0' COMMENT '삭제여부(0:활성화, 1: 비활성화)',
	`user_no` INT(11) NOT NULL COMMENT '작성자 번호(user.no)',
	`reg_date` DATETIME NOT NULL DEFAULT current_timestamp() COMMENT '게시글 등록 일자',
	`mod_date` DATETIME NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '게시글 수정 일자',
	PRIMARY KEY (`no`) USING BTREE,
	INDEX `IDX_board_user` (`user_no`) USING BTREE,
	CONSTRAINT `FK_board_user` FOREIGN KEY (`user_no`) REFERENCES `user` (`no`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COMMENT='게시판'
COLLATE='utf8mb4_unicode_ci'
ENGINE=InnoDB
;
CREATE TABLE mini.reply (
  no       INT          NOT NULL AUTO_INCREMENT COMMENT '번호',
  content  VARCHAR(255) NOT NULL                COMMENT '내용',
  del_yn   TINYINT      NOT NULL DEFAULT '0'    COMMENT '삭제여부(0:활성화, 1:삭제)',
  user_no  INT          NOT NULL                COMMENT '작성자 번호(user.no)',
  reg_date DATETIME     NOT NULL DEFAULT current_timestamp() COMMENT '댓글 등록 일자',
  mod_date DATETIME     NOT NULL DEFAULT current_timestamp() COMMENT '댓글 수정 일자',
  board_no INT          NOT NULL                COMMENT '게시글 번호(board.no)',
  PRIMARY KEY (no),
  FOREIGN KEY (user_no)  REFERENCES mini.user(no),
  FOREIGN KEY (board_no) REFERENCES mini.board(no)
);
COMMENT='댓글'
COLLATE='utf8mb4_unicode_ci'
ENGINE=InnoDB
;