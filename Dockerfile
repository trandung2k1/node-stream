# Base image
FROM alpine:latest

# WORKDIR /app

RUN apk add --no-cache bash

# ADD http://source.file/url ./

# Copy single file
# COPY README.txt ./

# Copy all the files
# COPY . .

# CMD command args1 args2

# Prevent shell injection recommended
# CMD [ "bash", "args1", "args2", ... ]

# Can use the internet
# ADD source dest

# EXPOSE port

CMD [ "bash" ] 