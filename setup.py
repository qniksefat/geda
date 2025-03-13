from setuptools import setup, find_packages

setup(
    name="geda",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "pandas",
        "PyPDF2",
        "sqlalchemy",
    ],
    python_requires=">=3.8",
) 