CREATE TABLE IF NOT EXISTS eg_user_csc (
   id BIGSERIAL PRIMARY KEY,

    userid BIGINT NOT NULL,
    username VARCHAR(100),
    email VARCHAR(255),
    cscid VARCHAR(100) UNIQUE,
    fullname VARCHAR(255),
    owner VARCHAR(100),
    vlecheck VARCHAR(10),
    statecode VARCHAR(10),
    activestatus VARCHAR(10),
    usertype VARCHAR(50),
    lastactive DATE,
    lgstatecode VARCHAR(20),
    lgdistrictcode VARCHAR(20),
    rap VARCHAR(100),
    pos VARCHAR(100),

    createdby BIGINT,
    createdtime BIGINT,
    lastmodifiedby BIGINT,
    lastmodifiedtime BIGINT
);