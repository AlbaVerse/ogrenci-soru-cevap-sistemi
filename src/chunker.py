def split_text(text, chunk_size=1000):
    chunks = []
    while len(text) > chunk_size:
        split_index = text.rfind(' ', 0, chunk_size) 
        
        if split_index == -1:        
            split_index = chunk_size
            
        chunks.append(text[:split_index].strip())
        text = text[split_index:].strip()
        
    if text:
        chunks.append(text)
        
    return chunks