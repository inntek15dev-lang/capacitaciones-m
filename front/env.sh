#!/bin/sh

# Recreate config file
rm -rf /usr/share/nginx/html/env-config.js
touch /usr/share/nginx/html/env-config.js

# Add assignment 
echo "window._env_ = {" >> /usr/share/nginx/html/env-config.js

# Read each line in .env file
# Each line represents an environment variable
# We only want those starting with VITE_
printenv | grep VITE_ | while read -r line 
do
  # Split env var by equals sign
  if [ -n "$line" ]; then
    varname=$(echo "$line" | cut -d '=' -f 1)
    varvalue=$(echo "$line" | cut -d '=' -f 2-)
    
    # Append configuration property to JS file
    echo "  $varname: \"$varvalue\"," >> /usr/share/nginx/html/env-config.js
  fi
done

echo "};" >> /usr/share/nginx/html/env-config.js
