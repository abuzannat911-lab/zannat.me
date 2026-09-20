-- MySQL dump 10.13  Distrib 9.6.0, for macos26.4 (arm64)
--
-- Host: localhost    Database: zannat_db
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bank_details`
--

DROP TABLE IF EXISTS `bank_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_details` (
  `id` int NOT NULL,
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `account_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `account_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `routing_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `swift_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `branch` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_details`
--

LOCK TABLES `bank_details` WRITE;
/*!40000 ALTER TABLE `bank_details` DISABLE KEYS */;
INSERT INTO `bank_details` VALUES (1,'Dutch Bangla Bank PLC','Abu Zannat Md Mosaddek','1621010088950','090851456','DBBLBDDH','Rangpur Branch','2026-09-20 13:24:24');
/*!40000 ALTER TABLE `bank_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bug_types`
--

DROP TABLE IF EXISTS `bug_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bug_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `count` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bug_types`
--

LOCK TABLES `bug_types` WRITE;
/*!40000 ALTER TABLE `bug_types` DISABLE KEYS */;
INSERT INTO `bug_types` VALUES (1,'Plugin Crash',14),(2,'WooCommerce',18),(3,'Malware/Security',11),(4,'Database/PHP',6),(5,'CSS/Theme',12);
/*!40000 ALTER TABLE `bug_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `phone` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `vat` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `address` text COLLATE utf8mb4_unicode_ci,
  `created_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `updated_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES ('cli_1','Claudio Campesato','CAMPES S.r.l.','info@campes.it','+39 348 745 4436','IT05496370262','Via Noalese 84/E - 31100 Treviso Italy','2026-08-10T22:19:41.134Z','2026-09-20T13:46:32.200Z'),('cli_1788507442671_bj40','Acme US Corp','Acme Inc','billing@acme.com','+8801832953608','EIN 12-3456789','100 Broadway, NY, USA','2026-09-04T07:37:22.671Z','2026-09-20T15:20:05.822Z'),('cli_1789917566251_sgna','Client Name','','','','','','2026-09-20T15:19:26.252Z','2026-09-20T15:19:26.252Z'),('cli_1789917631294_jreo','Abu Zannat','ZANNAT NETWORK','abujannat911@gmail.com','+8801832953608','EIN 12-3456789','100 Broadway, NY, USA','2026-09-20T15:20:31.294Z','2026-09-20T15:20:35.883Z'),('cli_1789918167140_lgyd','Test Customer','','','','','','2026-09-20T15:29:27.140Z','2026-09-20T15:29:27.140Z'),('cli_1789918188590_bzm1','Acme Corporation','','','','','','2026-09-20T15:29:48.590Z','2026-09-20T15:29:48.590Z'),('cli_1789918427458_eexu','Jane Doe','','jane@doe.com','','','','2026-09-20T15:33:47.458Z','2026-09-20T15:33:47.458Z'),('cli_2','Sarah Jones','WP Fix Co','sarah@wpfix.com','','','San Francisco, CA, USA','2026-06-22T10:00:00.000Z','2026-09-20T13:24:24.562Z');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `earnings`
--

DROP TABLE IF EXISTS `earnings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `earnings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `month` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `month` (`month`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `earnings`
--

LOCK TABLES `earnings` WRITE;
/*!40000 ALTER TABLE `earnings` DISABLE KEYS */;
INSERT INTO `earnings` VALUES (1,'March',42000.00,'2026-09-20 13:24:24'),(2,'April',49000.00,'2026-09-20 13:24:24'),(3,'May',58000.00,'2026-09-20 13:24:24'),(4,'June',71000.00,'2026-09-20 13:24:24');
/*!40000 ALTER TABLE `earnings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `homepage_content`
--

DROP TABLE IF EXISTS `homepage_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `homepage_content` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `about` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `homepage_content`
--

LOCK TABLES `homepage_content` WRITE;
/*!40000 ALTER TABLE `homepage_content` DISABLE KEYS */;
INSERT INTO `homepage_content` VALUES (1,'Abu Zannat (WP Specialist)','WordPress Specialist & Web Developer','assets/photo1.jpg','Hi, I am Abu Zannat, a WordPress expert...','2026-09-20 13:24:24');
/*!40000 ALTER TABLE `homepage_content` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `due_date` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `my_address` text COLLATE utf8mb4_unicode_ci,
  `my_logo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `client_company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `client_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `client_phone` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `client_vat` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `client_address` text COLLATE utf8mb4_unicode_ci,
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `bank_account_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `bank_account_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `bank_routing` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `bank_swift` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `bank_branch` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `payment_method` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `payment_terms` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `po_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `items_json` longtext COLLATE utf8mb4_unicode_ci,
  `subtotal` decimal(12,2) DEFAULT '0.00',
  `tax_rate` decimal(6,2) DEFAULT '0.00',
  `tax_amount` decimal(12,2) DEFAULT '0.00',
  `discount_percent` decimal(6,2) DEFAULT '0.00',
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `total` decimal(12,2) DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Unpaid',
  `created_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `updated_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `number` (`number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES ('inv_1788508044845_h20e','INV-1007','2026-09-04','2026-09-04','EUR','Astha Building\nDorshona Mor, Rangpur City Bypass\nRangpur city, Rangpur\nBangladesh','/assets/zannat_inner_symbol_icon.png','Claudio Campesato ','CAMPES S.r.l.','info@campes.it','','IT05496370262','Via Noalese 84/E - 31100 Treviso Italy','Dutch Bangla Bank PLC','Abu Zannat Md Mosaddek','1621010088950','090851456','DBBLBDDH','Rangpur Branch','International Wire / ACH / SEPA','Due on Receipt','','[{\"desc\":\"WordPress Core & Plugin Bug Diagnostics\",\"qty\":1,\"rate\":50}]',50.00,0.00,0.00,0.00,0.00,50.00,'','Paid','2026-09-04T07:47:24.845Z','2026-09-20T13:24:24.566Z'),('inv_1789917566255_47jo','INV-1008','2026-09-20','','USD','','','','','','','','','','','','','','','','','','[{\"desc\":\"WordPress Core & Plugin Bug Diagnostics\",\"qty\":1,\"rate\":150}]',150.00,0.00,0.00,0.00,0.00,150.00,'','Due','2026-09-20T15:19:26.256Z','2026-09-20T15:19:28.760Z'),('inv_1789917602946_ik7v','INV-1009','2026-09-20','','USD','Astha Building\nDorshona Mor, Rangpur City Bypass\nRangpur city, Rangpur\nBangladesh','/assets/zannat_inner_symbol_icon.png','Acme US Corp','Acme Inc','billing@acme.com','+8801832953608','EIN 12-3456789','100 Broadway, NY, USA','Dutch Bangla Bank PLC','Abu Zannat Md Mosaddek','1621010088950','090851456','DBBLBDDH','Rangpur Branch','International Wire / ACH / SEPA','Due on Receipt','','[{\"desc\":\"WordPress Core & Plugin Bug Diagnostics\",\"qty\":1,\"rate\":150}]',150.00,0.00,0.00,0.00,0.00,150.00,'','Paid','2026-09-20T15:20:02.947Z','2026-09-20T15:20:02.947Z'),('inv_1789917605823_jwri','INV-1010','2026-09-20','','USD','Astha Building\nDorshona Mor, Rangpur City Bypass\nRangpur city, Rangpur\nBangladesh','/assets/zannat_inner_symbol_icon.png','Acme US Corp','Acme Inc','billing@acme.com','+8801832953608','EIN 12-3456789','100 Broadway, NY, USA','Dutch Bangla Bank PLC','Abu Zannat Md Mosaddek','1621010088950','090851456','DBBLBDDH','Rangpur Branch','International Wire / ACH / SEPA','Due on Receipt','','[{\"desc\":\"WordPress Core & Plugin Bug Diagnostics\",\"qty\":1,\"rate\":150}]',150.00,0.00,0.00,0.00,0.00,150.00,'','Paid','2026-09-20T15:20:05.824Z','2026-09-20T15:20:05.824Z'),('inv_1789917635885_naja','INV-1011','2026-09-20','','USD','Astha Building\nDorshona Mor, Rangpur City Bypass\nRangpur city, Rangpur\nBangladesh','/assets/zannat_inner_symbol_icon.png','Abu Zannat','ZANNAT NETWORK','abujannat911@gmail.com','+8801832953608','EIN 12-3456789','100 Broadway, NY, USA','Dutch Bangla Bank PLC','Abu Zannat Md Mosaddek','1621010088950','090851456','DBBLBDDH','Rangpur Branch','International Wire / ACH / SEPA','Due on Receipt','','[{\"desc\":\"WordPress Core & Plugin Bug Diagnostics\",\"qty\":1,\"rate\":150}]',150.00,0.00,0.00,0.00,0.00,150.00,'','Paid','2026-09-20T15:20:35.886Z','2026-09-20T15:20:35.886Z');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meta_settings`
--

DROP TABLE IF EXISTS `meta_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meta_settings` (
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meta_settings`
--

LOCK TABLES `meta_settings` WRITE;
/*!40000 ALTER TABLE `meta_settings` DISABLE KEYS */;
INSERT INTO `meta_settings` VALUES ('nextInvoiceNum','1015');
/*!40000 ALTER TABLE `meta_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pages`
--

DROP TABLE IF EXISTS `pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `layout` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'standard',
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pages`
--

LOCK TABLES `pages` WRITE;
/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
INSERT INTO `pages` VALUES (1,'My Setup','my-setup','standard','<h1>Welcome to My Setup</h1><p>Here is where I build awesome WordPress plugins.</p>','2026-09-20 13:24:24','2026-09-20 13:24:24');
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `smtp_config`
--

DROP TABLE IF EXISTS `smtp_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smtp_config` (
  `id` int NOT NULL,
  `host` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `port` int DEFAULT '587',
  `secure` tinyint(1) DEFAULT '0',
  `user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `pass` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `auth_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'password',
  `oauth_client_id` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `oauth_client_secret` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `oauth_refresh_token` text COLLATE utf8mb4_unicode_ci,
  `oauth_access_token` text COLLATE utf8mb4_unicode_ci,
  `oauth_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smtp_config`
--

LOCK TABLES `smtp_config` WRITE;
/*!40000 ALTER TABLE `smtp_config` DISABLE KEYS */;
INSERT INTO `smtp_config` VALUES (1,'smtp.gmail.com',587,0,'abuzannat911@gmail.com','lhyybyhxtjqzcgbw','2026-09-20 14:52:38','password','test-client-id.apps.googleusercontent.com','test-secret','','','');
/*!40000 ALTER TABLE `smtp_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `site_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `bug_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `description` text COLLATE utf8mb4_unicode_ci,
  `severity` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Medium',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `date` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES ('TKT-2026-012','Sarah Jones','sarah@wpfix.com','http://wpfix.com','WooCommerce','Cart page is completely blank after theme update.','High','Pending','2026-06-22','','2026-09-20 13:24:24'),('TKT-2026-013','Sarah Jones','sarah@wpfix.com','http://wpfix.com','WooCommerce','Cart page is completely blank after theme update.','High','Pending','2026-06-22','','2026-09-20 13:24:24'),('TKT-2026-014','Sarah Jones','sarah@wpfix.com','http://wpfix.com','WooCommerce','Cart page is completely blank after theme update.','High','Pending','2026-06-22','','2026-09-20 13:24:24');
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','zannatbugfix','2026-09-20 13:24:24'),(2,'wpdev','specialpassword','2026-09-20 13:24:24');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-20 23:30:54
