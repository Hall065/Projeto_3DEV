@echo off
echo Instalando dependencias do PredialFix...

REM Instalar dependências PHP
echo.
echo [1/5] Instalando dependencias PHP...
composer install

REM Instalar dependências JavaScript
echo.
echo [2/5] Instalando dependencias JavaScript...
npm install

REM Copiar .env
echo.
echo [3/5] Configurando arquivo .env...
if not exist .env (
    copy .env.example .env
    echo Arquivo .env criado
) else (
    echo Arquivo .env já existe
)

REM Gerar chave da aplicação
echo.
echo [4/5] Gerando chave da aplicacao...
php artisan key:generate

REM Executar migrations
echo.
echo [5/5] Executando migrations...
php artisan migrate

echo.
echo Setup concluido com sucesso!
pause
