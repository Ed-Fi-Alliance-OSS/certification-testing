import os
import re
import glob
import argparse

def convert_sql(mssql_script):
    if not mssql_script:
        return ""  # Return an empty string if the input is None or empty

    # Function to correctly place semicolons at the end of SQL statements
    def place_semicolons(script):
        if not script.strip():
            return script  # No changes if the script is empty

        lines = script.splitlines()
        processed_lines = []
        for i, line in enumerate(lines):
            stripped_line = line.strip()

            # Handle section headers (---Header---), which should not have semicolons
            if stripped_line.startswith('---'):
                processed_lines.append(line)
                continue

            # Add the current line
            processed_lines.append(line)

            # Check if the current line is the end of a SQL query
            if stripped_line and not stripped_line.startswith('--'):  # Exclude comments
                # If next line is a section header or blank, add a semicolon to this line
                if i + 1 >= len(lines) or lines[i + 1].strip().startswith('---') or not lines[i + 1].strip():
                    if not stripped_line.endswith(';'):
                        processed_lines[-1] += ';'

        return '\n'.join(processed_lines)

    # Add missing semicolons to the script
    mssql_script = place_semicolons(mssql_script)

    # Define common replacements from MSSQL to PostgreSQL
    replacements = [
        (r'\[([^\]]+)\]', r'\1'),  # Replace [column_name] with column_name
        (r'\bnvarchar\b', r'varchar'),  # Replace nvarchar with varchar
        (r'\bdatetime\b', r'timestamp'),  # Replace datetime with timestamp
        (r'\bGETDATE\(\)\b', r'CURRENT_TIMESTAMP'),  # Replace GETDATE() with CURRENT_TIMESTAMP
        (r'\bISNULL\((.+?),(.+?)\)', r'COALESCE(\1,\2)'),  # Replace ISNULL with COALESCE
        (r'\bIDENTITY\((\d+),(\d+)\)\b', r'SERIAL'),  # Replace IDENTITY with SERIAL
        (r'\bNOLOCK\b', r''),  # Remove NOLOCK
        (r'\bUNIQUEIDENTIFIER\b', r'UUID'),  # Replace UNIQUEIDENTIFIER with UUID
        (r'\bGO\b', r''),  # Remove GO statements
        (r'\bWITH\s*\(NOLOCK\)\b', r''),  # Remove WITH (NOLOCK)
        (r'\btinyint\b', r'smallint'),  # Replace tinyint with smallint
        (r'\bN\'', r'\''),  # Replace N' with '
        (r'\\\\', r'\\\\'),  # Escape backslashes
    ]

    # Process the script line by line for replacements
    lines = mssql_script.splitlines()
    converted_lines = []

    for line in lines:
        if line.strip().startswith('--'):  # Preserve comments
            converted_lines.append(line)
        else:
            # Apply replacements to non-comment lines
            postgres_line = line
            for pattern, replacement in replacements:
                postgres_line = re.sub(pattern, replacement, postgres_line, flags=re.IGNORECASE)

            # Convert all table and column names to lowercase
            postgres_line = re.sub(r'\b([A-Za-z_][A-Za-z0-9_]*)\b', lambda match: match.group(1).lower(), postgres_line)

            converted_lines.append(postgres_line)

    return '\n'.join(converted_lines)


def convert_files_in_folder(input_folder, output_folder):
    # Ensure the output folder exists
    os.makedirs(output_folder, exist_ok=True)

    # Iterate through all .sql files in the input folder
    for filename in os.listdir(input_folder):
        if filename.endswith(".sql"):
            input_file_path = os.path.join(input_folder, filename)
            output_file_path = os.path.join(output_folder, filename)

            # Read the input file
            with open(input_file_path, 'r', encoding='utf-8') as file:
                mssql_script = file.read()

            # Convert the script
            postgres_script = convert_sql(mssql_script)

            # Write the converted script to the output file
            with open(output_file_path, 'w', encoding='utf-8') as file:
                file.write(postgres_script)

            print(f"Converted: {filename} -> {output_file_path}")

def main():
    # Set up argument parsing
    parser = argparse.ArgumentParser(description="Convert MSSQL SQL files to PostgreSQL SQL files.")
    parser.add_argument("input_folder", help="Path to the input folder containing MSSQL SQL files")
    parser.add_argument("output_folder", help="Path to the output folder to save PostgreSQL SQL files")

    args = parser.parse_args()

    # Pass the arguments to the conversion function
    convert_files_in_folder(args.input_folder, args.output_folder)
    print("Conversion complete!")

if __name__ == "__main__":
    main()
