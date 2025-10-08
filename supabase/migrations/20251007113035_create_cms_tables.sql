/*
  # Solar Energy CMS Database Schema

  ## Overview
  Complete database schema for a Solar Energy Company CMS with full content management capabilities.

  ## 1. New Tables

  ### `categories`
  - `id` (uuid, primary key) - Unique category identifier
  - `name` (text) - Category name
  - `slug` (text, unique) - URL-friendly category identifier
  - `description` (text) - Category description
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `articles`
  - `id` (uuid, primary key) - Unique article identifier
  - `title` (text) - Article title
  - `excerpt` (text) - Short article summary
  - `content` (text) - Full article content
  - `cover_image` (text) - Cover image URL
  - `video_url` (text, optional) - YouTube or video URL
  - `author` (text) - Article author name
  - `category_id` (uuid, foreign key) - Reference to categories table
  - `tags` (text array) - Article tags for categorization
  - `published_date` (timestamptz) - Publication date
  - `created_at` (timestamptz) - Creation timestamp
  - `created_by_user_id` (uuid) - User who created the article
  - `updated_at` (timestamptz) - Last update timestamp

  ### `contact_messages`
  - `id` (uuid, primary key) - Unique message identifier
  - `name` (text) - Sender name
  - `email_address` (text) - Sender email
  - `subject` (text) - Message subject
  - `message` (text) - Message content
  - `date_received` (timestamptz) - When message was received
  - `is_read` (boolean) - Message read status

  ### `newsletter_subscribers`
  - `id` (uuid, primary key) - Unique subscriber identifier
  - `name` (text) - Subscriber name
  - `email_address` (text, unique) - Subscriber email
  - `date_subscribed` (timestamptz) - Subscription date
  - `is_active` (boolean) - Active subscription status

  ### `cms_users`
  - `id` (uuid, primary key) - References auth.users
  - `name` (text) - User full name
  - `email` (text, unique) - User email
  - `role` (text) - User role (Admin or Publisher)
  - `created_at` (timestamptz) - Account creation date
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security

  ### Row Level Security (RLS)
  - Enable RLS on all tables
  - Create policies for authenticated users
  - Restrict sensitive operations to Admin role
  - Public read access for published content where appropriate

  ## 3. Important Notes
  - All tables use UUID for primary keys
  - Foreign key constraints ensure data integrity
  - Timestamps automatically track creation and updates
  - RLS policies enforce role-based access control
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text DEFAULT '',
  content text DEFAULT '',
  cover_image text DEFAULT '',
  video_url text DEFAULT '',
  author text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  published_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  created_by_user_id uuid,
  updated_at timestamptz DEFAULT now()
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email_address text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  date_received timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email_address text UNIQUE NOT NULL,
  date_subscribed timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create cms_users table
CREATE TABLE IF NOT EXISTS cms_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Publisher')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_date);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author);
CREATE INDEX IF NOT EXISTS idx_contact_messages_date ON contact_messages(date_received);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for articles
CREATE POLICY "Authenticated users can view articles"
  ON articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete articles"
  ON articles FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for contact_messages
CREATE POLICY "Authenticated users can view messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete messages"
  ON contact_messages FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for newsletter_subscribers
CREATE POLICY "Authenticated users can view subscribers"
  ON newsletter_subscribers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update subscribers"
  ON newsletter_subscribers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete subscribers"
  ON newsletter_subscribers FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for cms_users
CREATE POLICY "Users can view own profile"
  ON cms_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON cms_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cms_users
      WHERE cms_users.id = auth.uid()
      AND cms_users.role = 'Admin'
    )
  );

CREATE POLICY "Admins can insert users"
  ON cms_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cms_users
      WHERE cms_users.id = auth.uid()
      AND cms_users.role = 'Admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON cms_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cms_users
      WHERE cms_users.id = auth.uid()
      AND cms_users.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cms_users
      WHERE cms_users.id = auth.uid()
      AND cms_users.role = 'Admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON cms_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cms_users
      WHERE cms_users.id = auth.uid()
      AND cms_users.role = 'Admin'
    )
  );