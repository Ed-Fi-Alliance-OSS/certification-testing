# SQL Certification Scripts Project Structure  

These SQL scripts

This repository contains SQL scripts for the validation process during certification testing. Currently there are two database management systems: **Microsoft SQL Server (MSSQL)** and **PostgreSQL**. Each database has a dedicated folder with equivalent scripts, adapted for its specific syntax and functionality.  

---

## Project Structure  

```plaintext
📦 sql
├── 📂 mssql
│   ├── AssessmentV3
│   ├── SISv3
├── 📂 pgsql
│   ├── AssessmentV4
│   ├── AssessmentV5
│   ├── SISV4
│   ├── SISV5
└── README.md
```
## Folder Details  

### `mssql/` Folder  
This folder contains scripts specifically designed for **Microsoft SQL Server**

### `pgsql/` Folder  
This folder contains the equivalent scripts written for **PostgreSQL**, using PostgreSQL-specific syntax and features.  

Both folders contain scripts with similar names and functionality to ensure consistency between the two databases.  

---

## How to Use  

1. **Identify the database type you are working with:**  
   - **For MSSQL:** Navigate to the `mssql/` folder.  
   - **For PostgreSQL:** Navigate to the `pgsql/` folder.  

2. **Locate the required script file** in the selected folder.  

3. **Use a compatible tool to execute the script:**  
   - **For MSSQL:** Tools like **SQL Server Management Studio (SSMS)**
   - **For PostgreSQL:** Tools like **pgAdmin**, **psql CLI**, or other PostgreSQL-supported environments are recommended.  

---

## Key Notes  

- The script names are identical across both folders for easier navigation and comparison.  
- Ensure your database user has the appropriate permissions to execute the scripts.  
- While the scripts aim to achieve the same functionality, there might be minor adjustments specific to each database due to syntax or feature differences.  

---

For any questions, issues, or contributions, feel free to open an issue or submit a pull request.  
