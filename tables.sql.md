### Revised SQL Schema for User-Related Models

#### 1. Enums

```sql
CREATE TYPE user_permission_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE identity_provider AS ENUM ('CAL', 'GOOGLE', 'SAML');
CREATE TYPE membership_role AS ENUM ('MEMBER', 'ADMIN', 'OWNER');
```

#### 2. Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    permission_role user_permission_role NOT NULL DEFAULT 'USER',
    identity_provider identity_provider NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- e.g., active, suspended, deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
```

#### 3. User Passwords Table

```sql
CREATE TABLE user_passwords (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_passwords_user_id ON user_passwords(user_id);
```

#### 4. Travel Schedule Table

```sql
CREATE TABLE travel_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    time_zone VARCHAR(100) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    prev_time_zone VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_travel_schedules_user_id ON travel_schedules(user_id);
```

#### 5. Membership Table

```sql
CREATE TABLE memberships (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    role membership_role NOT NULL,
    disable_impersonation BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_team_id ON memberships(team_id);
```

#### 6. Verification Token Table

```sql
CREATE TABLE verification_tokens (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_in_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    team_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    secondary_email_id INTEGER
);
CREATE INDEX idx_verification_tokens_identifier ON verification_tokens(identifier);
```

#### 7. Instant Meeting Tokens Table

```sql
CREATE TABLE instant_meeting_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    team_id INTEGER NOT NULL,
    booking_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_instant_meeting_tokens_team_id ON instant_meeting_tokens(team_id);
CREATE INDEX idx_instant_meeting_tokens_booking_id ON instant_meeting_tokens(booking_id);
```

