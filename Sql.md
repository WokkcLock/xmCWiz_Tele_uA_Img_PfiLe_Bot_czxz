## 表定义

* kinds表

```sql
CREATE TABLE IF NOT EXISTS kinds (
	id INTEGER PRIMARY KEY,
	kind NVARCHAR(50) NOT NULL,
	chat_id INTEGER NOT NULL, 
    count INTEGER NOT NULL DEFAULT 0,
	INDEX idx_kinds_chat_id (chat_id)
);
```

* tags表

```sql
CREATE TABLE IF NOT EXISTS ${tagTableName} (
    id INTEGER PRIMARY KEY,
    kind_id INTEGER REFERENCES ${kindTableName}(id) ON DELETE CASCADE,
    tag VARCHAR(${tagstrLenLimit}) NOT NULL,
    INDEX idx_${tagTableName}_kind_id (kind_id),
    UNIQUE (kind_id, tag)
)
```

* cache表有若5张, 类似的

```sql
CREATE TABLE IF NOT EXISTS cache (
    id INTEGER PRIMARY KEY,
    md5 CHAR(32) NOT NULL,
    file_ext INTEGER,
    tag VARCHAR(${tagstrLenLimit}) NOT NULL,
    image_id INTEGER
);
```

其中file_ext采用整数进行枚举

5张cache表分别为

* none_cache：没有任何rating限制下的图
* general_cache：general rating 限制下的图，下面以此类推
* sensitive_cache
* questionable_cache
* explicit_cache
