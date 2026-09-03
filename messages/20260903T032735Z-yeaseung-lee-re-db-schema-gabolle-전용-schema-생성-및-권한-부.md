from: yeaseung-lee
to: jaehyeon
at: 2026-09-03T03:27:35.811Z
subject: Re: [DB schema] gabolle 전용 schema 생성 및 권한 부여 요청
replyTo: 20260903T022706Z-jaehyeon-db-schema-gabolle-전용-schema-생성-및-권한-부여-요

docker logs backend --tail 40 전체 원문입니다.

```
        at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:525) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.AbstractBeanFactory.lambda$doGetBean$0(AbstractBeanFactory.java:333) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton(DefaultSingletonBeanRegistry.java:371) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:331) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:201) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.config.DependencyDescriptor.resolveCandidate(DependencyDescriptor.java:229) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.DefaultListableBeanFactory.addCandidateEntry(DefaultListableBeanFactory.java:2008) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.DefaultListableBeanFactory.findAutowireCandidates(DefaultListableBeanFactory.java:1971) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.DefaultListableBeanFactory.resolveMultipleBeanCollection(DefaultListableBeanFactory.java:1863) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.DefaultListableBeanFactory.resolveMultipleBeans(DefaultListableBeanFactory.java:1833) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.DefaultListableBeanFactory.doResolveDependency(DefaultListableBeanFactory.java:1711) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.DefaultListableBeanFactory.resolveDependency(DefaultListableBeanFactory.java:1651) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.ConstructorResolver.resolveAutowiredArgument(ConstructorResolver.java:912) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.ConstructorResolver.createArgumentArray(ConstructorResolver.java:791) ~[spring-beans-7.0.1.jar!/:7.0.1]
        ... 42 common frames omitted
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'googleIdTokenVerifier' defined in URL [jar:nested:/app/gabolle-backend.jar/!BOOT-INF/classes/!/com/gabolle/backend/auth/service/GoogleIdTokenVerifier.class]: Failed to instantiate [com.gabolle.backend.auth.service.GoogleIdTokenVerifier]: No default constructor found
        at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.instantiateBean(AbstractAutowireCapableBeanFactory.java:1344) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBeanInstance(AbstractAutowireCapableBeanFactory.java:1231) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:565) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:525) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.AbstractBeanFactory.lambda$doGetBean$0(AbstractBeanFactory.java:333) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton(DefaultSingletonBeanRegistry.java:371) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:331) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:201) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.config.DependencyDescriptor.resolveCandidate(DependencyDescriptor.java:229) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.DefaultListableBeanFactory.doResolveDependency(DefaultListableBeanFactory.java:1762) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.DefaultListableBeanFactory.resolveDependency(DefaultListableBeanFactory.java:1651) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.ConstructorResolver.resolveAutowiredArgument(ConstructorResolver.java:912) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.ConstructorResolver.createArgumentArray(ConstructorResolver.java:791) ~[spring-beans-7.0.1.jar!/:7.0.1]
        ... 60 common frames omitted
Caused by: org.springframework.beans.BeanInstantiationException: Failed to instantiate [com.gabolle.backend.auth.service.GoogleIdTokenVerifier]: No default constructor found
        at org.springframework.beans.factory.support.SimpleInstantiationStrategy.instantiate(SimpleInstantiationStrategy.java:102) ~[spring-beans-7.0.1.jar!/:7.0.1]
        at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.instantiateBean(AbstractAutowireCapableBeanFactory.java:1338) ~[spring-beans-7.0.1.jar!/:7.0.1]
        ... 72 common frames omitted
Caused by: java.lang.NoSuchMethodException: com.gabolle.backend.auth.service.GoogleIdTokenVerifier.<init>()
        at java.base/java.lang.Class.getConstructor0(Unknown Source) ~[na:na]
        at java.base/java.lang.Class.getDeclaredConstructor(Unknown Source) ~[na:na]
        at org.springframework.beans.factory.support.SimpleInstantiationStrategy.instantiate(SimpleInstantiationStrategy.java:98) ~[spring-beans-7.0.1.jar!/:7.0.1]
        ... 73 common frames omitted
```
