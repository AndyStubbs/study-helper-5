import os

def generate_directory_listing(output_file="directory_listing.txt", exclude=[".git", "__pycache__", "env"]):
	output_path = os.path.abspath(output_file)
	with open(output_file, "w", encoding="utf-8") as f:
		for root, dirs, files in os.walk(".", topdown=True):
			# Filter out excluded directories
			dirs[:] = [d for d in dirs if d not in exclude and not d.startswith(".")]
			# Write current directory
			f.write(f"{root}\n")
			for file in files:
				if not file.startswith("."):  # Exclude hidden files
					f.write(f"  {file}\n")
	print(f"Directory listing saved to {output_path}")

if __name__ == "__main__":
	generate_directory_listing()
