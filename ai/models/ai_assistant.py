import os
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.llms import Ollama
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import TextLoader

# Step 1: Load all project files
def load_project_files(directory):
    docs = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith((".py", ".js", ".ts", ".java", ".sql")):
                path = os.path.join(root, file)
                try:
                    loader = TextLoader(path, encoding='utf-8')
                    docs.extend(loader.load())
                except:
                    pass
    return docs

# Step 2: Split into chunks
def split_docs(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    return splitter.split_documents(documents)

# Step 3: Create embeddings
def create_vector_db(chunks):
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    db = Chroma.from_documents(chunks, embeddings, persist_directory="./db")
    db.persist()
    return db

# Step 4: Load DB
def load_db():
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    return Chroma(persist_directory="./db", embedding_function=embeddings)

# Step 5: Ask AI
def ask_ai(db, query):
    retriever = db.as_retriever()
    docs = retriever.get_relevant_documents(query)

    context = "\n\n".join([doc.page_content for doc in docs])

    llm = Ollama(model="codellama:13b")

    prompt = f"""
You are a senior software engineer.

Context from project:
{context}

Question:
{query}

Answer clearly with explanation and code if needed.
"""

    return llm.invoke(prompt)

# MAIN
if __name__ == "__main__":
    print("Indexing project...")
    docs = load_project_files("./")
    chunks = split_docs(docs)
    db = create_vector_db(chunks)

    print("Ready! Ask questions.")
    while True:
        q = input(">>> ")
        if q == "exit":
            break
        print(ask_ai(db, q))