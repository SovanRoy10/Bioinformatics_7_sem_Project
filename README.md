# How to Build the Dataset

## Step 1:  Web Scraping

### For Getting the UniProt Protein Entries

#### Import Required Libraries
```python
import pandas as pd
from pandas import json_normalize
from bs4 import BeautifulSoup
from selenium import webdriver
import time
```

#### Configure WebDriver
```python
driver = webdriver.Chrome() 
driver.get('https://www.uniprot.org/uniprotkb?query=*&facets=model_organism%3A9606%2Creviewed%3Atrue&view=table')

time.sleep(5)
```

#### Extract and Parse Webpage Content
```python
webpage = driver.page_source
soup = BeautifulSoup(webpage, 'html.parser')

print(soup.prettify())

entries = soup.select('table tbody tr td a') 

# Get the size of the entries
size_of_entries = len(entries)

# Print the size
print(f"Total number of entries: {size_of_entries}")

# Check if entries are found and print them
if entries:
    for entry in entries:
        print(entry.get('href'))
else:
    print("No entries found")

print(f"Type of entries: {type(entries)}")
```

#### Filter and Process Entries
```python
# Extract the part before '/entry' and remove 'Homo sapiens (Human)'
extracted_values = [entry.text.split('/entry')[0] for entry in entries]

# Filter out values that contain 'Homo sapiens (Human)'
filtered_values = [value for value in extracted_values if 'Homo sapiens (Human)' not in value]

# Print the filtered values
print("Filtered Entries:")
for value in filtered_values:
    print(value)
```

#### Save the Filtered Values to a CSV File
```python
# Convert filtered values to a DataFrame
df = pd.DataFrame(filtered_values, columns=['Entry'])

# Save the DataFrame to a CSV file
df.to_csv('filtered_entries.csv', index=False, encoding='utf-8')

print("Filtered entries saved to 'filtered_entries.csv'")
```


## Step 2: Install the Pfeature Python Library

### Install Pfeature
To use the `Pfeature` Python library, install it by following these steps:

1. Clone the Pfeature GitHub repository or download the required files.
   ```bash
   git clone https://github.com/raghavagps/Pfeature.git
   ```

2. Navigate to the `Pfeature` directory and add the `pfeature.py` file to your working directory.



### Include `pfeature.py` in Your Jupyter Notebook or Google Colab

- If you are working in Jupyter Notebook, place the `pfeature.py` file in the same directory as your notebook.
- In Google Colab, upload the `pfeature.py` file directly or mount your Google Drive and include it.

## Step 3: Sort and Process the Dataset

### Load and Sort Entries
```python
# Load the CSV file
df = pd.read_csv('filtered_entries.csv')

# Extract and sort the 'Entry' column
entries_array = sorted(df['Entry'].tolist())

# Print the sorted entries and their count
print(f"Sorted entries array: {entries_array}")
print(f"Length of the entries array: {len(entries_array)}")
```

---

## Step 4: Download and Process FASTA Files

### 4.1: Download FASTA Files using UniProt APi
```python
import os
import requests

def download_fasta(uniprot_ids, output_dir):
    """
    Downloads FASTA files from UniProt for the given UniProt IDs and saves them in the specified directory.
    Skips the download if the file already exists. Tracks the number of files successfully downloaded.
    """
    os.makedirs(output_dir, exist_ok=True)
    base_url = "https://www.uniprot.org/uniprot/"
    downloaded_count = 0

    for idx, uniprot_id in enumerate(uniprot_ids, start=1):
        file_path = os.path.join(output_dir, f"{uniprot_id}.fasta")
        if os.path.exists(file_path):
            print(f"Row {idx}: File already exists: {uniprot_id}")
        else:
            response = requests.get(f"{base_url}{uniprot_id}.fasta")
            if response.status_code == 200:
                with open(file_path, "w") as file:
                    file.write(response.text)
                print(f"Row {idx}: Downloaded: {uniprot_id}")
                downloaded_count += 1
            else:
                print(f"Row {idx}: Failed to download: {uniprot_id}")

    print(f"\nTotal files downloaded: {downloaded_count}/{len(uniprot_ids)}")
```

### 4.2: Process FASTA Files and only using these functions from pfeature aac_wp, pcp_wp, sep_wp, ser_wp
```python
import pandas as pd

def process_file(inputfile, output_dir):
    """
    Processes a single FASTA file using specified analysis functions and saves the results in the output directory.
    Skips the processing if the output files already exist.
    """
    os.makedirs(output_dir, exist_ok=True)
    record = {'UniProt_ID': os.path.splitext(os.path.basename(inputfile))[0]}

    # List of functions to call
    analysis_functions = ['aac_wp', 'pcp_wp', 'paac_wp', 'sep_wp', 'ser_wp']

    for func_name in analysis_functions:
        output_file = os.path.join(output_dir, f'{func_name}_output.csv')

        if os.path.exists(output_file):
            print(f"Output file already exists: {output_file}")
        else:
            if func_name == 'paac_wp':
                globals()[func_name](inputfile, output_file, lg=5, pw=0.05)
            else:
                globals()[func_name](inputfile, output_file)

        if os.path.exists(output_file):
            record.update(pd.read_csv(output_file, header=None).iloc[0].to_dict())

    return record
```

### 4.3: Run the Pipeline
```python
def run_pipeline(uniprot_ids, fasta_dir, output_dir):
    """
    Runs the pipeline for downloading and processing UniProt FASTA files.
    Skips files if already downloaded or processed.
    """
    download_fasta(uniprot_ids, fasta_dir)

    records = []

    for filename in os.listdir(fasta_dir):
        if filename.endswith('.fasta'):
            inputfile = os.path.join(fasta_dir, filename)
            file_output_dir = os.path.join(output_dir, os.path.splitext(filename)[0])

            record = process_file(inputfile, file_output_dir)
            records.append(record)

    print(f"Processed {len(records)} files.")

# Example usage
uniprot_ids = entries_array  # Replace 'entries_array' with the actual list of UniProt IDs
fasta_directory = "fasta_files"
output_directory = "output_analysis"

run_pipeline(uniprot_ids, fasta_directory, output_directory)
```

### After processing each UniProt entry, four different CSV files are generated: aac_wp, pcp_wp, sep_wp, and ser_wp.

## Visual Representation

### This is the filtered_entries.csv:

![Workflow Visualization](https://iili.io/2P6HgKx.png)

### After downloading all the fasta files they will be saved in one folder:

![Workflow Visualization](https://iili.io/2P6FqIS.png)

### For each UniProt entry four different CSV files are generated: aac_wp, pcp_wp, sep_wp, and ser_wp:

![Workflow Visualization](https://iili.io/2P6rwMX.png)

## Step 5: Combine All CSV Files for All UniProt Entries

### Step 5.1: Initialize Directories and Variables

Define the list of UniProt IDs, the folder where the UniProt ID folders are stored, and the CSV files to process.

```python
import os
import pandas as pd

# Define the list of UniProt IDs (example: entries_array_negative)
uniprot_ids = entries_array_negative

# Define the folder where the UniProt ID folders are stored
output_dir = "output_analysis_sovan"

# Define the list of CSV files you want to process
csv_files = ["aac_wp_output.csv", "paac_wp_output.csv", "pcp_wp_output.csv", "sep_wp_output.csv", "ser_wp_output.csv"]
```

### Step 5.2: Initialize the Combined Data List

Create an empty list to store all the combined data from the CSV files for each UniProt entry.

```python
# Initialize an empty list to store all combined data
all_combined_data = []
```

### Step 5.3: Loop Through Each UniProt ID

For each UniProt ID, loop through all the relevant CSV files and process them. For each file, extract the data and store it temporarily in a DataFrame.

```python
# Loop through each UniProt ID
for uniprot_id in uniprot_ids:
    # Initialize an empty list to store the data for this UniProt ID
    combined_data = []
    
    # Loop through each CSV file for the current UniProt ID
    for csv_file in csv_files:
        file_path = os.path.join(output_dir, uniprot_id, csv_file)
        
        if os.path.exists(file_path):
            # Read the CSV file
            df = pd.read_csv(file_path, header=None)
            
            # Extract the 0th row as column names
            column_names = df.iloc[0].values  # 0th row as column names
            
            # Extract the 1st row as values
            values = df.iloc[1].values  # 1st row as the corresponding values
            
            # Create a DataFrame for this CSV with the 0th row as columns and the 1st row as values
            temp_df = pd.DataFrame([values], columns=column_names)
            combined_data.append(temp_df)  # Add the DataFrame to the list
        else:
            print(f"File not found: {file_path}")

```

### Step 5.4: Combine Data for Each UniProt ID

After processing all CSV files for a specific UniProt ID, combine them horizontally (i.e., concatenate the DataFrames). Add a new column entry with the UniProt ID as its value.

```python
    # Combine all DataFrames for this UniProt ID into one (concatenate them horizontally)
    if combined_data:  # Only process if there are DataFrames to combine
        final_df = pd.concat(combined_data, axis=1)

        # Add a new column 'entry' with the UniProt ID as its value for every row
        final_df['entry'] = uniprot_id

        # Reorder the columns to place 'entry' at the beginning
        final_df = final_df[['entry'] + [col for col in final_df.columns if col != 'entry']]

        # Append the final DataFrame for this UniProt ID to the list
        all_combined_data.append(final_df)
    else:
        print(f"No data available for UniProt ID: {uniprot_id}")

```

### Step 5.5: Combine All UniProt Data

Once all the data for each UniProt ID is processed and combined, merge all individual DataFrames for each UniProt ID into a single large DataFrame. This will result in a final combined dataset with all the relevant data for all UniProt entries.

```python
  # Combine all UniProt ID DataFrames into one large DataFrame
if all_combined_data:  # Only process if there are DataFrames to combine
    final_combined_df = pd.concat(all_combined_data, axis=0, ignore_index=True)

    # Display the final combined DataFrame
    print(final_combined_df)
else:
    print("No data was combined. Check your file paths and data.")


```

## Step 6: Save the Final Combined DataFrame to CSV

After combining all the data for each UniProt ID into a single DataFrame, you can save the final combined dataset into a CSV file.

```python
# Specify the path where you want to save the final CSV file
output_file_path = "combined_uniprot_data_negative.csv"

# Save the final combined DataFrame to the CSV file
final_combined_df.to_csv(output_file_path, index=False)

# Display the path where the file is saved
print(f"File saved at: {output_file_path}")
```


### The final dataset:- 
![Workflow Visualization](https://iili.io/2P6pozu.png)
